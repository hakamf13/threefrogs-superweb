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

		const startedAtLocal =
			typeof body?.startedAtLocal === "string" ? body.startedAtLocal.trim() : "";
		const durationMinutes = Number(body?.durationMinutes ?? 0);

		if (!startedAtLocal) {
			return NextResponse.json(
				{ error: "Mulai main wajib diisi." },
				{ status: 400 }
			);
		}

		if (
			!Number.isFinite(durationMinutes) ||
			durationMinutes < 60 ||
			durationMinutes > 720 ||
			durationMinutes % 60 !== 0
		) {
			return NextResponse.json(
				{ error: "Durasi harus kelipatan 60 menit." },
				{ status: 400 }
			);
		}

		const walkInSession = await prisma.walkInSession.findUnique({
			where: { id },
			select: {
				id: true,
				tableId: true,
				storeId: true,
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
				{ error: "Hanya sesi aktif yang bisa diedit waktunya." },
				{ status: 400 }
			);
		}

		const startedAt = new Date(`${startedAtLocal}:00+07:00`);
		if (Number.isNaN(startedAt.getTime())) {
			return NextResponse.json(
				{ error: "Format waktu mulai tidak valid." },
				{ status: 400 }
			);
		}

		const estimatedEndAt = new Date(
			startedAt.getTime() + durationMinutes * 60 * 1000
		);

		const startDateKey = formatDateKeyInJakarta(startedAt);
		const endDateKey = formatDateKeyInJakarta(estimatedEndAt);

		if (startDateKey !== endDateKey) {
			return NextResponse.json(
				{
					error:
						"Untuk sementara sesi walk-in harus tetap berada di hari yang sama.",
				},
				{ status: 400 }
			);
		}

		const bookingDateValue = new Date(`${startDateKey}T00:00:00.000Z`);

		const [bookingSlots, otherWalkIns] = await Promise.all([
			prisma.bookingSlot.findMany({
				where: {
					tableId: walkInSession.tableId,
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
					tableId: walkInSession.tableId,
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
			const slotStart = buildSlotDate(startDateKey, slot.slotHour);
			const slotEnd = buildSlotDate(startDateKey, slot.slotEndHour);

			return isOverlap(startedAt, estimatedEndAt, slotStart, slotEnd);
		});

		if (bookingConflict) {
			return NextResponse.json(
				{
					error:
						"Waktu sesi bentrok dengan booking terjadwal di meja yang sama.",
				},
				{ status: 409 }
			);
		}

		const walkInConflict = otherWalkIns.some((item) =>
			isOverlap(
				startedAt,
				estimatedEndAt,
				item.startedAt,
				item.estimatedEndAt
			)
		);

		if (walkInConflict) {
			return NextResponse.json(
				{
					error:
						"Waktu sesi bentrok dengan walk-in aktif lain di meja yang sama.",
				},
				{ status: 409 }
			);
		}

		await prisma.walkInSession.update({
			where: { id },
			data: {
				startedAt,
				estimatedEndAt,
				bookingDate: bookingDateValue,
			},
		});

		return NextResponse.json({
			success: true,
			startedAt: startedAt.toISOString(),
			estimatedEndAt: estimatedEndAt.toISOString(),
		});
	} catch (error) {
		console.error("Update walk-in time error:", error);

		return NextResponse.json(
			{ error: "Gagal mengupdate waktu sesi walk-in." },
			{ status: 500 }
		);
	}
}