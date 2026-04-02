import { prisma } from "../../../lib/prisma";
import { ACTIVE_BOOKING_STATUSES, TIME_SLOTS } from "../../../lib/constants";
import { expireOverdueBookings } from "./expire-overdue-bookings";

export async function getAdminAvailabilityByStoreAndDate(
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

  const bookingSlots = await prisma.bookingSlot.findMany({
    where: {
      storeId,
      bookingDate: dateValue,
      status: {
        in: [...ACTIVE_BOOKING_STATUSES],
      },
    },
    include: {
      booking: {
        select: {
          id: true,
          bookingCode: true,
          customerName: true,
          customerPhone: true,
          source: true,
          status: true,
        },
      },
    },
  });

  const slotMap = new Map<
    string,
    {
      status: string;
      bookingId: string;
      bookingCode: string;
      customerName: string;
      customerPhone: string;
      source: string;
    }
  >();

  for (const slot of bookingSlots) {
    slotMap.set(`${slot.tableId}-${slot.slotHour}`, {
      status: slot.status,
      bookingId: slot.booking.id,
      bookingCode: slot.booking.bookingCode,
      customerName: slot.booking.customerName,
      customerPhone: slot.booking.customerPhone,
      source: slot.booking.source,
    });
  }

  return tables.map((table) => ({
    ...table,
    slots: TIME_SLOTS.map((hour) => {
      const key = `${table.id}-${hour}`;
      const found = slotMap.get(key);

      if (!found) {
        return {
          hour,
          isAvailable: true,
          status: "AVAILABLE",
          bookingId: null,
          bookingCode: null,
          customerName: null,
          customerPhone: null,
          source: null,
        };
      }

      return {
        hour,
        isAvailable: false,
        status: found.status,
        bookingId: found.bookingId,
        bookingCode: found.bookingCode,
        customerName: found.customerName,
        customerPhone: found.customerPhone,
        source: found.source,
      };
    }),
  }));
}