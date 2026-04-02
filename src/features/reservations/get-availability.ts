import { prisma } from "../../../lib/prisma";
import { ACTIVE_BOOKING_STATUSES, TIME_SLOTS } from "../../../lib/constants";
import { expireOverdueBookings } from "./expire-overdue-bookings";

export async function getAvailabilityByStoreAndDate(
  storeId: string,
  bookingDate: string
) {
  await expireOverdueBookings();

  const dateValue = new Date(`${bookingDate}T00:00:00.000Z`);

  const tables = await prisma.table.findMany({
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
    },
  });

  const bookedSlots = await prisma.bookingSlot.findMany({
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
      status: true,
    },
  });

  const bookedMap = new Map<string, Set<number>>();

  for (const slot of bookedSlots) {
    const key = slot.tableId;
    if (!bookedMap.has(key)) {
      bookedMap.set(key, new Set<number>());
    }
    bookedMap.get(key)?.add(slot.slotHour);
  }

  return tables.map((table) => ({
    ...table,
    slots: TIME_SLOTS.map((hour) => ({
      hour,
      isAvailable: !bookedMap.get(table.id)?.has(hour),
    })),
  }));
}