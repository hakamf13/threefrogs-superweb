import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

type RateLimitScope = "bookingCreate" | "paymentProofUpload" | "login";

function getEnv(name: string) {
	return process.env[name]?.trim() || "";
}

function hasRateLimitEnv() {
	return Boolean(
		getEnv("UPSTASH_REDIS_REST_URL") && getEnv("UPSTASH_REDIS_REST_TOKEN")
	);
}

const redis = hasRateLimitEnv() ? Redis.fromEnv() : null;

const limiters = redis
	? {
			bookingCreate: new Ratelimit({
				redis,
				limiter: Ratelimit.slidingWindow(6, "1 m"),
				analytics: true,
				prefix: "threefrogs:booking-create",
			}),
			paymentProofUpload: new Ratelimit({
				redis,
				limiter: Ratelimit.slidingWindow(10, "10 m"),
				analytics: true,
				prefix: "threefrogs:payment-proof-upload",
			}),
			login: new Ratelimit({
				redis,
				limiter: Ratelimit.slidingWindow(10, "10 m"),
				analytics: true,
				prefix: "threefrogs:login",
			}),
		}
	: null;

function getClientIp(request: Request) {
	const forwardedFor = request.headers.get("x-forwarded-for");
	if (forwardedFor) {
		return forwardedFor.split(",")[0]?.trim() || "unknown";
	}

	const realIp = request.headers.get("x-real-ip");
	if (realIp) {
		return realIp.trim();
	}

	return "unknown";
}

export async function enforceRouteRateLimit(args: {
	request: Request;
	scope: RateLimitScope;
	identifier?: string;
}) {
	if (!limiters) {
		return null;
	}

	const { request, scope, identifier } = args;
	const ip = getClientIp(request);
	const key = identifier ? `${scope}:${identifier}:${ip}` : `${scope}:${ip}`;

	const result = await limiters[scope].limit(key);

	if (result.success) {
		return null;
	}

	return NextResponse.json(
		{ error: "Terlalu banyak permintaan. Coba lagi sebentar." },
		{
			status: 429,
			headers: {
				"X-RateLimit-Limit": String(result.limit),
				"X-RateLimit-Remaining": String(result.remaining),
				"X-RateLimit-Reset": String(result.reset),
			},
		}
	);
}