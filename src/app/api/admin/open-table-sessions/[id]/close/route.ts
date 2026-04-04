import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "../../../../../../lib/prisma";
import { calculateOpenTableBilling } from "../../../../../../features/open-tables/calculate-open-table-billing";

type RouteContext = {
	params: Promise<{
		id: string;
	}>;
};

export async function PATCH(_request: Request, context: RouteContext) {
	try {
		const session = await auth();

		if (!session?.user || session.user.role !== "ADMIN") {
			return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
		}

		const { id } = await context.params;

		const openSession = await prisma.openTableSession.findUnique({
			where: {
				id,
			},
			select: {
				id: true,
				status: true,
				openedAt: true,
				pricePerHour: true,
			},
		});

		if (!openSession) {
			return NextResponse.json(
				{ error: "Sesi Open Table tidak ditemukan." },
				{ status: 404 }
			);
		}

		if (openSession.status !== "OPEN") {
			return NextResponse.json(
				{ error: "Sesi ini sudah ditutup." },
				{ status: 400 }
			);
		}

		const closedAt = new Date();
		const billing = calculateOpenTableBilling(openSession.openedAt, closedAt);

		await prisma.openTableSession.update({
			where: {
				id: openSession.id,
			},
			data: {
				status: "CLOSED",
				closedAt,
				durationMinutes: billing.durationMinutes,
				billedHours: billing.billedHours,
				totalPrice: billing.totalPrice,
			},
		});

		return NextResponse.json({
			success: true,
		});
	} catch (error) {
		console.error("Close open table error:", error);

		return NextResponse.json(
			{ error: "Gagal menutup Open Table." },
			{ status: 500 }
		);
	}
}