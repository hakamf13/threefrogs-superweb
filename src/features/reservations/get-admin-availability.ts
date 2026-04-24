import { prisma } from "@/lib/prisma";
import { buildHourRange, getStoreHoursForDate } from "@/lib/store-hours";
import {
  buildBookingSlotsByTableHour,
  findWalkInForHour,
  getActiveOccupancyForStoreDate,
  getNowInJakarta,
  groupWalkInsByTableId,
} from "./table-occupancy";

export async function getAdminAvailabilityByStoreAndDate(
  storeId: string,
  bookingDate: string
) {
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
        displayLabel: true,
        capacity: true,
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
  const hourRange = resolvedHours.isClosed
    ? []
    : buildHourRange(resolvedHours.openHour, resolvedHours.closeHour);

  const bookingSlotsByTableHour = buildBookingSlotsByTableHour(
    occupancy.bookingSlots
  );
  const walkInsByTableId = groupWalkInsByTableId(occupancy.walkInSessions);

  const nowJakarta = getNowInJakarta();
  const isTodayInJakarta = nowJakarta.dateKey === bookingDate;

  return tables.map((table) => {
    const tableBookingSlots = bookingSlotsByTableHour.get(table.id);
    const tableWalkIns = walkInsByTableId.get(table.id) ?? [];

    const slots = hourRange.map((hour) => {
      const walkIn = findWalkInForHour({
        bookingDate,
        hour,
        walkIns: tableWalkIns,
      });

      if (walkIn) {
        return {
          hour,
          isAvailable: false,
          status: "WALK_IN",
          bookingId: null,
          bookingCode: null,
          customerName: walkIn.customerName,
          customerPhone: walkIn.customerPhone,
          source: "WALK_IN",
          openTableSessionId: null,
          walkInSessionId: walkIn.id,
          walkInEstimatedEndAt: walkIn.estimatedEndAt.toISOString(),
          walkInPaymentStatus: walkIn.paymentStatus,
        };
      }

      const bookingSlot = tableBookingSlots?.get(hour);

      if (bookingSlot) {
        return {
          hour,
          isAvailable: false,
          status: bookingSlot.status,
          bookingId: bookingSlot.booking.id,
          bookingCode: bookingSlot.booking.bookingCode,
          customerName: bookingSlot.booking.customerName,
          customerPhone: bookingSlot.booking.customerPhone,
          source: bookingSlot.booking.source,
          openTableSessionId: null,
          walkInSessionId: null,
          walkInEstimatedEndAt: null,
          walkInPaymentStatus: null,
        };
      }

      const isPastTime =
        isTodayInJakarta &&
        (hour < nowJakarta.hour ||
          (hour === nowJakarta.hour && nowJakarta.minute > 0));

      return {
        hour,
        isAvailable: !isPastTime,
        status: isPastTime ? "PAST_TIME" : "AVAILABLE",
        bookingId: null,
        bookingCode: null,
        customerName: null,
        customerPhone: null,
        source: null,
        openTableSessionId: null,
        walkInSessionId: null,
        walkInEstimatedEndAt: null,
        walkInPaymentStatus: null,
      };
    });

    return {
      id: table.id,
      tableNumber: table.tableNumber,
      tableCode: table.tableCode,
      displayLabel: table.displayLabel,
      capacity: table.capacity,
      slots,
    };
  });
}