import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PRICE_PER_HOUR } from "@/lib/constants";

type RouteContext = {
	params: Promise<{
		id: string;
	}>;
};

function roundUpTo30Minutes(value: number) {
	return Math.ceil(value / 30) * 30;
}

export async function PATCH(_request: Request, context: RouteContext) {
	try {
		const session = await auth();

		if (!session?.user || session.user.role !== "ADMIN") {
			return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
		}

		const { id } = await context.params;

		const walkIn = await prisma.walkInSession.findUnique({
			where: { id },
			select: {
				id: true,
				status: true,
				startedAt: true,
			},
		});

		if (!walkIn) {
			return NextResponse.json(
				{ error: "Sesi walk-in tidak ditemukan." },
				{ status: 404 }
			);
		}

		if (walkIn.status !== "ACTIVE") {
			return NextResponse.json(
				{ error: "Sesi ini sudah tidak aktif." },
				{ status: 400 }
			);
		}

		const actualEndedAt = new Date();
		const durationMinutes = Math.max(
			1,
			Math.ceil((actualEndedAt.getTime() - walkIn.startedAt.getTime()) / 60000)
		);
		const billedMinutes = roundUpTo30Minutes(durationMinutes);
		const totalPrice = Math.ceil((billedMinutes / 60) * PRICE_PER_HOUR);

		await prisma.walkInSession.update({
			where: { id: walkIn.id },
			data: {
				status: "CLOSED",
				actualEndedAt,
				durationMinutes,
				billedMinutes,
				totalPrice,
				closedByAdminId: session.user.id,
			},
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Close walk-in session error:", error);

		return NextResponse.json(
			{ error: "Gagal menutup sesi walk-in." },
			{ status: 500 }
		);
	}
}