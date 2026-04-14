import { prisma } from "@/lib/prisma";
import { ACTIVE_BOOKING_STATUSES } from "@/lib/constants";
import {
	getCurrentHourInJakarta,
	getTodayDateStringInJakarta,
} from "@/lib/booking-window";
import { expireOverdueBookings } from "./expire-overdue-bookings";
import { buildHourRange, getStoreHoursForDate } from "@/lib/store-hours";

export async function getAvailabilityByStoreAndDate(
	storeId: string,
	bookingDate: string
) {
	await expireOverdueBookings();

	const dateValue = new Date(`${bookingDate}T00:00:00.000Z`);
	const todayInJakarta = getTodayDateStringInJakarta();
	const isToday = bookingDate === todayInJakarta;
	const currentHour = getCurrentHourInJakarta();

	const [store, tables, bookedSlots] = await Promise.all([
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
				reason: "PAST_TIME" | "BOOKED" | null;
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

	return tables.map((table) => ({
		...table,
		slots: hourRange.map((hour) => {
			const isPastTimeToday = isToday && hour <= currentHour;
			const isBooked = bookedMap.get(table.id)?.has(hour) ?? false;

			return {
				hour,
				isAvailable: !isPastTimeToday && !isBooked,
				reason: isPastTimeToday ? "PAST_TIME" : isBooked ? "BOOKED" : null,
			};
		}),
	}));
}