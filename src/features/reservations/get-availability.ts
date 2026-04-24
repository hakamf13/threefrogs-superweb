import { prisma } from "@/lib/prisma";
import {
  getCurrentHourInJakarta,
  getTodayDateStringInJakarta,
} from "@/lib/booking-window";
import { buildHourRange, getStoreHoursForDate } from "@/lib/store-hours";
import { expireOverdueBookings } from "./expire-overdue-bookings";
import {
  buildBookingSlotsByTableHour,
  findWalkInForHour,
  getActiveOccupancyForStoreDate,
  groupWalkInsByTableId,
} from "./table-occupancy";

type PublicSlotReason = "PAST_TIME" | "BOOKED" | null;

export async function getAvailabilityByStoreAndDate(
  storeId: string,
  bookingDate: string
) {
  await expireOverdueBookings();

  const todayInJakarta = getTodayDateStringInJakarta();
  const isToday = bookingDate === todayInJakarta;
  const currentHour = getCurrentHourInJakarta();

  const [store, tables, occupancy] = await Promise.all([
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

    getActiveOccupancyForStoreDate({
      storeId,
      bookingDate,
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

  const bookingSlotsByTableHour = buildBookingSlotsByTableHour(
    occupancy.bookingSlots
  );
  const walkInsByTableId = groupWalkInsByTableId(occupancy.walkInSessions);

  return tables.map((table) => {
    const tableBookingSlots = bookingSlotsByTableHour.get(table.id);
    const tableWalkIns = walkInsByTableId.get(table.id) ?? [];

    return {
      ...table,
      slots: hourRange.map((hour) => {
        const isPastTimeToday = isToday && hour <= currentHour;
        const isBooked = tableBookingSlots?.has(hour) ?? false;
        const walkIn = findWalkInForHour({
          bookingDate,
          hour,
          walkIns: tableWalkIns,
        });

        const isBlocked = isBooked || Boolean(walkIn);

        return {
          hour,
          isAvailable: !isPastTimeToday && !isBlocked,
          reason: isPastTimeToday ? "PAST_TIME" : isBlocked ? "BOOKED" : null,
        };
      }),
    };
  });
}