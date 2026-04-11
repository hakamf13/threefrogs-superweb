import { prisma } from "@/lib/prisma";
import {
  ACTIVE_BOOKING_STATUSES,
  CLOSE_HOUR,
  OPEN_HOUR,
} from "@/lib/constants";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function getBookingDateKey(bookingDate: string) {
  return new Date(`${bookingDate}T00:00:00.000Z`);
}

function buildSlotDate(bookingDate: string, hour: number) {
  return new Date(`${bookingDate}T${pad(hour)}:00:00+07:00`);
}

function isOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
) {
  return startA < endB && endA > startB;
}

function getNowInJakarta() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const map = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  ) as Record<string, string>;

  return {
    dateKey: `${map.year}-${map.month}-${map.day}`,
    hour: Number(map.hour),
    minute: Number(map.minute),
  };
}

export async function getAdminAvailabilityByStoreAndDate(
  storeId: string,
  bookingDate: string
) {
  const bookingDateKey = getBookingDateKey(bookingDate);

  const [tables, bookingSlots, walkInSessions] = await Promise.all([
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

    prisma.bookingSlot.findMany({
      where: {
        bookingDate: bookingDateKey,
        table: {
          storeId,
          isActive: true,
        },
        status: {
          in: [...ACTIVE_BOOKING_STATUSES],
        },
      },
      orderBy: [
        { tableId: "asc" },
        { slotHour: "asc" },
      ],
      select: {
        tableId: true,
        slotHour: true,
        slotEndHour: true,
        status: true,
        booking: {
          select: {
            id: true,
            bookingCode: true,
            customerName: true,
            customerPhone: true,
            source: true,
          },
        },
      },
    }),

    prisma.walkInSession.findMany({
      where: {
        bookingDate: bookingDateKey,
        status: "ACTIVE",
        table: {
          storeId,
          isActive: true,
        },
      },
      orderBy: [
        { tableId: "asc" },
        { startedAt: "asc" },
      ],
      select: {
        id: true,
        tableId: true,
        customerName: true,
        customerPhone: true,
        startedAt: true,
        estimatedEndAt: true,
        paymentStatus: true,
      },
    }),
  ]);

  const slotsByTableId = new Map<string, typeof bookingSlots>();
  for (const slot of bookingSlots) {
    const existing = slotsByTableId.get(slot.tableId) ?? [];
    existing.push(slot);
    slotsByTableId.set(slot.tableId, existing);
  }

  const walkInsByTableId = new Map<string, typeof walkInSessions>();
  for (const session of walkInSessions) {
    const existing = walkInsByTableId.get(session.tableId) ?? [];
    existing.push(session);
    walkInsByTableId.set(session.tableId, existing);
  }

  const nowJakarta = getNowInJakarta();
  const isTodayInJakarta = nowJakarta.dateKey === bookingDate;

  const hourRange = Array.from(
    { length: CLOSE_HOUR - OPEN_HOUR },
    (_, index) => OPEN_HOUR + index
  );

  return tables.map((table) => {
    const tableBookingSlots = slotsByTableId.get(table.id) ?? [];
    const tableWalkIns = walkInsByTableId.get(table.id) ?? [];

    const slots = hourRange.map((hour) => {
      const slotStart = buildSlotDate(bookingDate, hour);
      const slotEnd = buildSlotDate(bookingDate, hour + 1);

      const walkIn = tableWalkIns.find((session) =>
        isOverlap(slotStart, slotEnd, session.startedAt, session.estimatedEndAt)
      );

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
        };
      }

      const bookingSlot = tableBookingSlots.find(
        (item) => item.slotHour === hour
      );

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
        };
      }

      const isPastTime =
        isTodayInJakarta &&
        (hour < nowJakarta.hour ||
          (hour === nowJakarta.hour && nowJakarta.minute > 0));

      return {
        hour,
        isAvailable: !isPastTime,
        status: "AVAILABLE",
        bookingId: null,
        bookingCode: null,
        customerName: null,
        customerPhone: null,
        source: null,
        openTableSessionId: null,
        walkInSessionId: null,
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