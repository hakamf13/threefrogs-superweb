import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
	ACTIVE_BOOKING_STATUSES,
	CLOSE_HOUR,
} from "@/lib/constants";

type RouteContext = {
	params: Promise<{
		id: string;
	}>;
};

function pad(value: number) {
	return String(value).padStart(2, "0");
}

function buildSlotDate(dateText: string, hour: number) {
	return new Date(`${dateText}T${pad(hour)}:00:00+07:00`);
}

function isOverlap(
	startA: Date,
	endA: Date,
	startB: Date,
	endB: Date
) {
	return startA < endB && endA > startB;
}

function getBookingDateText(value: Date) {
	return value.toISOString().slice(0, 10);
}

export async function PATCH(request: Request, context: RouteContext) {
	try {
		const session = await auth();

		if (!session?.user || session.user.role !== "ADMIN") {
			return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
		}

		const { id } = await context.params;
		const body = await request.json().catch(() => ({}));
		const extendMinutes = Number(body?.extendMinutes ?? 0);

		if (![30, 60, 90, 120].includes(extendMinutes)) {
			return NextResponse.json(
				{ error: "Durasi extend tidak valid." },
				{ status: 400 }
			);
		}

		const walkIn = await prisma.walkInSession.findUnique({
			where: { id },
			select: {
				id: true,
				tableId: true,
				bookingDate: true,
				status: true,
				startedAt: true,
				estimatedEndAt: true,
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

		const nextEstimatedEndAt = new Date(
			walkIn.estimatedEndAt.getTime() + extendMinutes * 60 * 1000
		);

		const endParts = new Intl.DateTimeFormat("en-GB", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
			timeZone: "Asia/Jakarta",
		}).formatToParts(nextEstimatedEndAt);

		const endHour =
			Number(endParts.find((part) => part.type === "hour")?.value ?? "0");
		const endMinute =
			Number(endParts.find((part) => part.type === "minute")?.value ?? "0");

		const endMinutes = endHour * 60 + endMinute;

		if (endMinutes > CLOSE_HOUR * 60 || endMinutes === 0) {
			return NextResponse.json(
				{ error: "Perpanjangan ini melewati jam tutup toko." },
				{ status: 400 }
			);
		}

		const bookingDateText = getBookingDateText(walkIn.bookingDate);

		const bookingSlots = await prisma.bookingSlot.findMany({
			where: {
				tableId: walkIn.tableId,
				bookingDate: walkIn.bookingDate,
				status: {
					in: [...ACTIVE_BOOKING_STATUSES],
				},
			},
			select: {
				slotHour: true,
				slotEndHour: true,
			},
		});

		const hasBookingConflict = bookingSlots.some((slot) => {
			const slotStart = buildSlotDate(bookingDateText, slot.slotHour);
			const slotEnd = buildSlotDate(bookingDateText, slot.slotEndHour);
			return isOverlap(walkIn.startedAt, nextEstimatedEndAt, slotStart, slotEnd);
		});

		if (hasBookingConflict) {
			return NextResponse.json(
				{ error: "Perpanjangan bentrok dengan booking terjadwal." },
				{ status: 409 }
			);
		}

		const otherWalkIns = await prisma.walkInSession.findMany({
			where: {
				tableId: walkIn.tableId,
				bookingDate: walkIn.bookingDate,
				status: "ACTIVE",
				id: {
					not: walkIn.id,
				},
			},
			select: {
				startedAt: true,
				estimatedEndAt: true,
			},
		});

		const hasWalkInConflict = otherWalkIns.some((item) =>
			isOverlap(
				walkIn.startedAt,
				nextEstimatedEndAt,
				item.startedAt,
				item.estimatedEndAt
			)
		);

		if (hasWalkInConflict) {
			return NextResponse.json(
				{ error: "Perpanjangan bentrok dengan walk-in aktif lain." },
				{ status: 409 }
			);
		}

		await prisma.walkInSession.update({
			where: { id: walkIn.id },
			data: {
				estimatedEndAt: nextEstimatedEndAt,
			},
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Extend walk-in session error:", error);

		return NextResponse.json(
			{ error: "Gagal memperpanjang sesi walk-in." },
			{ status: 500 }
		);
	}
}