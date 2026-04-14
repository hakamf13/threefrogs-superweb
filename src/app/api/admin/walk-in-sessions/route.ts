import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ACTIVE_BOOKING_STATUSES } from "@/lib/constants";
import { getStoreHoursForDate } from "@/lib/store-hours";

function pad(value: number) {
	return String(value).padStart(2, "0");
}

function parseJakartaLocalDateTime(value: string) {
	return new Date(`${value}:00+07:00`);
}

function getBookingDateKey(dateText: string) {
	return new Date(`${dateText}T00:00:00.000Z`);
}

function getHourMinuteFromLocal(value: string) {
	const [, timePart] = value.split("T");
	const [hour, minute] = timePart.split(":").map(Number);
	return { hour, minute };
}

function buildSlotDate(dateText: string, hour: number) {
	return new Date(`${dateText}T${pad(hour)}:00:00+07:00`);
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

function isOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
	return startA < endB && endA > startB;
}

export async function POST(request: Request) {
	try {
		const session = await auth();

		if (!session?.user || session.user.role !== "ADMIN") {
			return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
		}

		const body = await request.json().catch(() => ({}));

		const storeId =
			typeof body?.storeId === "string" ? body.storeId.trim() : "";
		const tableId =
			typeof body?.tableId === "string" ? body.tableId.trim() : "";
		const customerName =
			typeof body?.customerName === "string" ? body.customerName.trim() : "";
		const customerPhone =
			typeof body?.customerPhone === "string" ? body.customerPhone.trim() : "";
		const notes =
			typeof body?.notes === "string" ? body.notes.trim() : "";
		const startedAtLocal =
			typeof body?.startedAtLocal === "string" ? body.startedAtLocal.trim() : "";
		const initialDurationMinutes = Number(body?.initialDurationMinutes ?? 0);
		const paymentStatus =
			body?.paymentStatus === "PARTIAL" || body?.paymentStatus === "PAID"
				? body.paymentStatus
				: "UNPAID";
		const paymentNote =
			typeof body?.paymentNote === "string" ? body.paymentNote.trim() : "";

		if (!storeId || !tableId || !customerName || !startedAtLocal) {
			return NextResponse.json(
				{ error: "Store, meja, nama customer, dan waktu mulai wajib diisi." },
				{ status: 400 }
			);
		}

		if (
			!Number.isFinite(initialDurationMinutes) ||
			initialDurationMinutes < 60 ||
			initialDurationMinutes > 720 ||
			initialDurationMinutes % 60 !== 0
		) {
			return NextResponse.json(
				{ error: "Durasi awal harus kelipatan 60 menit." },
				{ status: 400 }
			);
		}

		const startedAt = parseJakartaLocalDateTime(startedAtLocal);
		const estimatedEndAt = new Date(
			startedAt.getTime() + initialDurationMinutes * 60 * 1000
		);

		if (Number.isNaN(startedAt.getTime()) || Number.isNaN(estimatedEndAt.getTime())) {
			return NextResponse.json(
				{ error: "Format waktu mulai tidak valid." },
				{ status: 400 }
			);
		}

		const bookingDateText = startedAtLocal.slice(0, 10);
		const endDateText = formatDateKeyInJakarta(estimatedEndAt);

		if (bookingDateText !== endDateText) {
			return NextResponse.json(
				{ error: "Walk-in harus selesai di hari yang sama." },
				{ status: 400 }
			);
		}

		const bookingDate = getBookingDateKey(bookingDateText);

		const store = await prisma.store.findFirst({
			where: {
				id: storeId,
				isActive: true,
				category: "MAHJONG",
			},
			select: {
				id: true,
				openHour: true,
				closeHour: true,
				operatingHours: {
					select: {
						dayOfWeek: true,
						openHour: true,
						closeHour: true,
						isClosed: true,
					},
				},
			},
		});

		if (!store) {
			return NextResponse.json(
				{ error: "Store tidak ditemukan." },
				{ status: 404 }
			);
		}

		const resolvedHours = getStoreHoursForDate(store, bookingDateText);

		if (resolvedHours.isClosed) {
			return NextResponse.json(
				{ error: "Store tutup pada tanggal sesi ini." },
				{ status: 400 }
			);
		}

		const { hour, minute } = getHourMinuteFromLocal(startedAtLocal);
		const startMinutes = hour * 60 + minute;

		const endHourJakarta = new Intl.DateTimeFormat("en-GB", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
			timeZone: "Asia/Jakarta",
		}).formatToParts(estimatedEndAt);

		const endHour =
			Number(endHourJakarta.find((part) => part.type === "hour")?.value ?? "0");
		const endMinute =
			Number(endHourJakarta.find((part) => part.type === "minute")?.value ?? "0");
		const endMinutes = endHour * 60 + endMinute;

		if (startMinutes < resolvedHours.openHour * 60) {
			return NextResponse.json(
				{ error: "Walk-in tidak bisa dimulai sebelum jam operasional store." },
				{ status: 400 }
			);
		}

		if (endMinutes > resolvedHours.closeHour * 60 || endMinutes === 0) {
			return NextResponse.json(
				{ error: "Estimasi selesai melewati jam tutup store." },
				{ status: 400 }
			);
		}

		const table = await prisma.table.findFirst({
			where: {
				id: tableId,
				storeId,
				isActive: true,
			},
			select: {
				id: true,
			},
		});

		if (!table) {
			return NextResponse.json(
				{ error: "Meja tidak ditemukan." },
				{ status: 404 }
			);
		}

		const bookingSlots = await prisma.bookingSlot.findMany({
			where: {
				tableId,
				bookingDate,
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
			return isOverlap(startedAt, estimatedEndAt, slotStart, slotEnd);
		});

		if (hasBookingConflict) {
			return NextResponse.json(
				{ error: "Ada booking aktif yang bentrok dengan rentang waktu ini." },
				{ status: 409 }
			);
		}

		const activeWalkIns = await prisma.walkInSession.findMany({
			where: {
				tableId,
				bookingDate,
				status: "ACTIVE",
			},
			select: {
				id: true,
				startedAt: true,
				estimatedEndAt: true,
			},
		});

		const hasWalkInConflict = activeWalkIns.some((walkIn) =>
			isOverlap(startedAt, estimatedEndAt, walkIn.startedAt, walkIn.estimatedEndAt)
		);

		if (hasWalkInConflict) {
			return NextResponse.json(
				{ error: "Ada walk-in aktif lain yang bentrok dengan sesi ini." },
				{ status: 409 }
			);
		}

		const created = await prisma.walkInSession.create({
			data: {
				storeId,
				tableId,
				customerName,
				customerPhone: customerPhone || null,
				notes: notes || null,
				startedAt,
				estimatedEndAt,
				bookingDate,
				status: "ACTIVE",
				paymentStatus,
				paymentNote: paymentNote || null,
				createdByAdminId: session.user.id,
			},
			select: {
				id: true,
			},
		});

		return NextResponse.json({
			success: true,
			sessionId: created.id,
		});
	} catch (error) {
		console.error("Create walk-in session error:", error);

		return NextResponse.json(
			{ error: "Gagal membuat walk-in session." },
			{ status: 500 }
		);
	}
}