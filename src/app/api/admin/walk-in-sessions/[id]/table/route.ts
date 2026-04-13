import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ACTIVE_BOOKING_STATUSES } from "@/lib/constants";

type RouteContext = {
	params: Promise<{
		id: string;
	}>;
};

function pad(value: number) {
	return String(value).padStart(2, "0");
}

function formatDateKeyInJakarta(date: Date) {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Jakarta",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(date);

	const map = Object.fromEntries(
		parts
			.filter((part) => part.type !== "literal")
			.map((part) => [part.type, part.value])
	) as Record<string, string>;

	return `${map.year}-${map.month}-${map.day}`;
}

function buildSlotDate(dateText: string, hour: number) {
	return new Date(`${dateText}T${pad(hour)}:00:00+07:00`);
}

function isOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
	return startA < endB && endA > startB;
}

export async function PATCH(request: Request, context: RouteContext) {
	try {
		const session = await auth();

		if (!session?.user || session.user.role !== "ADMIN") {
			return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
		}

		const { id } = await context.params;
		const body = await request.json().catch(() => ({}));

		const targetTableId =
			typeof body?.tableId === "string" ? body.tableId.trim() : "";

		if (!targetTableId) {
			return NextResponse.json(
				{ error: "Meja tujuan wajib dipilih." },
				{ status: 400 }
			);
		}

		const walkInSession = await prisma.walkInSession.findUnique({
			where: { id },
			select: {
				id: true,
				storeId: true,
				tableId: true,
				startedAt: true,
				estimatedEndAt: true,
				bookingDate: true,
				status: true,
			},
		});

		if (!walkInSession) {
			return NextResponse.json(
				{ error: "Sesi walk-in tidak ditemukan." },
				{ status: 404 }
			);
		}

		if (walkInSession.status !== "ACTIVE") {
			return NextResponse.json(
				{ error: "Hanya sesi aktif yang bisa dipindahkan." },
				{ status: 400 }
			);
		}

		if (walkInSession.tableId === targetTableId) {
			return NextResponse.json({ success: true });
		}

		const targetTable = await prisma.table.findUnique({
			where: { id: targetTableId },
			select: {
				id: true,
				storeId: true,
				isActive: true,
			},
		});

		if (!targetTable || !targetTable.isActive) {
			return NextResponse.json(
				{ error: "Meja tujuan tidak ditemukan atau tidak aktif." },
				{ status: 404 }
			);
		}

		if (targetTable.storeId !== walkInSession.storeId) {
			return NextResponse.json(
				{
					error:
						"Untuk sementara pindah meja hanya bisa dilakukan dalam store yang sama.",
				},
				{ status: 400 }
			);
		}

		const bookingDateKey = formatDateKeyInJakarta(walkInSession.startedAt);
		const bookingDateValue = new Date(`${bookingDateKey}T00:00:00.000Z`);

		const [bookingSlots, otherWalkIns] = await Promise.all([
			prisma.bookingSlot.findMany({
				where: {
					tableId: targetTableId,
					bookingDate: bookingDateValue,
					status: {
						in: [...ACTIVE_BOOKING_STATUSES],
					},
				},
				select: {
					slotHour: true,
					slotEndHour: true,
				},
			}),

			prisma.walkInSession.findMany({
				where: {
					tableId: targetTableId,
					bookingDate: bookingDateValue,
					status: "ACTIVE",
					id: {
						not: id,
					},
				},
				select: {
					id: true,
					startedAt: true,
					estimatedEndAt: true,
				},
			}),
		]);

		const bookingConflict = bookingSlots.some((slot) => {
			const slotStart = buildSlotDate(bookingDateKey, slot.slotHour);
			const slotEnd = buildSlotDate(bookingDateKey, slot.slotEndHour);

			return isOverlap(
				walkInSession.startedAt,
				walkInSession.estimatedEndAt,
				slotStart,
				slotEnd
			);
		});

		if (bookingConflict) {
			return NextResponse.json(
				{
					error:
						"Meja tujuan bentrok dengan booking terjadwal pada jam sesi ini.",
				},
				{ status: 409 }
			);
		}

		const walkInConflict = otherWalkIns.some((item) =>
			isOverlap(
				walkInSession.startedAt,
				walkInSession.estimatedEndAt,
				item.startedAt,
				item.estimatedEndAt
			)
		);

		if (walkInConflict) {
			return NextResponse.json(
				{
					error:
						"Meja tujuan bentrok dengan walk-in aktif lain pada jam sesi ini.",
				},
				{ status: 409 }
			);
		}

		await prisma.walkInSession.update({
			where: { id },
			data: {
				tableId: targetTableId,
			},
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Update walk-in table error:", error);

		return NextResponse.json(
			{ error: "Gagal memindahkan meja sesi walk-in." },
			{ status: 500 }
		);
	}
}