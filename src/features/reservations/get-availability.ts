import { prisma } from "@/lib/prisma";
import { ACTIVE_BOOKING_STATUSES } from "@/lib/constants";
import {
	getCurrentHourInJakarta,
	getTodayDateStringInJakarta,
} from "@/lib/booking-window";
import { expireOverdueBookings } from "./expire-overdue-bookings";
import { buildHourRange, getStoreHoursForDate } from "@/lib/store-hours";

type PublicSlotReason = "PAST_TIME" | "BOOKED" | null;

function pad(value: number) {
	return String(value).padStart(2, "0");
}

function buildSlotDate(bookingDate: string, hour: number) {
	return new Date(`${bookingDate}T${pad(hour)}:00:00+07:00`);
}

function isOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
	return startA < endB && endA > startB;
}

export async function getAvailabilityByStoreAndDate(
	storeId: string,
	bookingDate: string
) {
	await expireOverdueBookings();

	const dateValue = new Date(`${bookingDate}T00:00:00.000Z`);
	const todayInJakarta = getTodayDateStringInJakarta();
	const isToday = bookingDate === todayInJakarta;
	const currentHour = getCurrentHourInJakarta();

	const [store, tables, bookedSlots, walkInSessions] = await Promise.all([
		prisma.store.findUnique({
			where: {
				id: storeId,
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
		}),

		prisma.table.findMany({
			where: {
				storeId,
				isActive: true,
			},
			orderBy: {
				tableNumber: "asc",
			},
			select: {
				id: true,
				tableNumber: true,
				tableCode: true,
				capacity: true,
				displayLabel: true,
				note: true,
			},
		}),

		prisma.bookingSlot.findMany({
			where: {
				storeId,
				bookingDate: dateValue,
				status: {
					in: [...ACTIVE_BOOKING_STATUSES],
				},
			},
			select: {
				tableId: true,
				slotHour: true,
				slotEndHour: true,
				status: true,
			},
		}),

		prisma.walkInSession.findMany({
			where: {
				storeId,
				bookingDate: dateValue,
				status: "ACTIVE",
				table: {
					isActive: true,
				},
			},
			select: {
				id: true,
				tableId: true,
				startedAt: true,
				estimatedEndAt: true,
			},
		}),
	]);

	if (!store) {
		throw new Error("Store tidak ditemukan.");
	}

	const resolvedHours = getStoreHoursForDate(store, bookingDate);

	if (resolvedHours.isClosed) {
		return tables.map((table) => ({
			...table,
			slots: [] as Array<{
				hour: number;
				isAvailable: boolean;
				reason: PublicSlotReason;
			}>,
		}));
	}

	const hourRange = buildHourRange(
		resolvedHours.openHour,
		resolvedHours.closeHour
	);

	const bookedMap = new Map<string, Set<number>>();

	for (const slot of bookedSlots) {
		const key = slot.tableId;

		if (!bookedMap.has(key)) {
			bookedMap.set(key, new Set<number>());
		}

		const bucket = bookedMap.get(key)!;

		for (let hour = slot.slotHour; hour < slot.slotEndHour; hour += 1) {
			bucket.add(hour);
		}
	}

	const walkInsByTableId = new Map<string, typeof walkInSessions>();

	for (const session of walkInSessions) {
		const existing = walkInsByTableId.get(session.tableId) ?? [];
		existing.push(session);
		walkInsByTableId.set(session.tableId, existing);
	}

	return tables.map((table) => {
		const tableWalkIns = walkInsByTableId.get(table.id) ?? [];

		return {
			...table,
			slots: hourRange.map((hour) => {
				const slotStart = buildSlotDate(bookingDate, hour);
				const slotEnd = buildSlotDate(bookingDate, hour + 1);

				const isPastTimeToday = isToday && hour <= currentHour;
				const isBooked = bookedMap.get(table.id)?.has(hour) ?? false;
				const isOccupiedByWalkIn = tableWalkIns.some((session) =>
					isOverlap(slotStart, slotEnd, session.startedAt, session.estimatedEndAt)
				);

				const isBlocked = isBooked || isOccupiedByWalkIn;

				return {
					hour,
					isAvailable: !isPastTimeToday && !isBlocked,
					reason: isPastTimeToday ? "PAST_TIME" : isBlocked ? "BOOKED" : null,
				};
			}),
		};
	});
}