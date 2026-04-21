"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import UserLogoutButton from "@/components/auth/user-logout-button";

type SessionPayload = {
	user?: {
		role?: string | null;
	} | null;
} | null;

const navItemClass =
	"inline-flex items-center rounded-full px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[var(--tf-lavender)] hover:text-[var(--tf-purple)]";

export default function SiteHeaderAuthActions() {
	const [session, setSession] = useState<SessionPayload>(null);
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		let isMounted = true;

		async function loadSession() {
			try {
				const response = await fetch("/api/auth/session", {
					cache: "no-store",
				});

				if (!response.ok) {
					throw new Error("Gagal mengambil session.");
				}

				const result = (await response.json()) as SessionPayload;

				if (isMounted) {
					setSession(result);
				}
			} catch (error) {
				console.error("Header session fetch error:", error);

				if (isMounted) {
					setSession(null);
				}
			} finally {
				if (isMounted) {
					setIsLoaded(true);
				}
			}
		}

		loadSession();

		return () => {
			isMounted = false;
		};
	}, []);

	if (!isLoaded) {
		return (
			<div className="flex items-center gap-1.5">
				<span className="h-9 w-20 rounded-full bg-slate-100" />
				<span className="h-9 w-24 rounded-full bg-slate-100" />
			</div>
		);
	}

	const isAdmin = session?.user?.role === "ADMIN";
	const isLoggedIn = Boolean(session?.user);

	if (!isLoggedIn) {
		return (
			<>
				<Link href="/login" className={navItemClass}>
					Login
				</Link>

				<Link
					href="/register"
					className="inline-flex items-center rounded-full bg-[var(--tf-purple)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--tf-purple-dark)]"
				>
					Register
				</Link>
			</>
		);
	}

	return (
		<>
			<Link href="/profile" className={navItemClass}>
				Profil
			</Link>

			<Link href="/my-bookings" className={navItemClass}>
				Booking Saya
			</Link>

			{isAdmin ? (
				<Link
					href="/admin"
					className="inline-flex items-center rounded-full bg-[var(--tf-orange)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--tf-orange-dark)]"
				>
					Admin Dashboard
				</Link>
			) : null}

			<UserLogoutButton />
		</>
	);
}