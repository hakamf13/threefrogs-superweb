import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
	params: Promise<{
		id: string;
	}>;
};

export async function PATCH(request: Request, context: RouteContext) {
	try {
		const session = await auth();

		if (!session?.user || session.user.role !== "ADMIN") {
			return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
		}

		const { id } = await context.params;
		const body = await request.json().catch(() => ({}));

		const paymentStatus =
			body?.paymentStatus === "PARTIAL" || body?.paymentStatus === "PAID"
				? body.paymentStatus
				: "UNPAID";

		const paymentNote =
			typeof body?.paymentNote === "string" ? body.paymentNote.trim() : "";

		const existing = await prisma.walkInSession.findUnique({
			where: { id },
			select: {
				id: true,
			},
		});

		if (!existing) {
			return NextResponse.json(
				{ error: "Sesi walk-in tidak ditemukan." },
				{ status: 404 }
			);
		}

		await prisma.walkInSession.update({
			where: { id },
			data: {
				paymentStatus,
				paymentNote: paymentNote || null,
			},
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Update walk-in payment error:", error);

		return NextResponse.json(
			{ error: "Gagal mengubah status pembayaran walk-in." },
			{ status: 500 }
		);
	}
}