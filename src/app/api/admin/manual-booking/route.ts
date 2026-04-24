import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "../../../../lib/prisma";
import {
  ACTIVE_BOOKING_STATUSES,
  BOOKING_HOLD_MINUTES,
  PRICE_PER_HOUR,
} from "../../../../lib/constants";
import { createManualBookingSchema } from "../../../../lib/validations";
import { expireOverdueBookings } from "@/features/reservations/expire-overdue-bookings";
import {
  getBookingWindow,
  isDateWithinBookingWindow,
  getCurrentHourInJakarta,
  getTodayDateStringInJakarta,
} from "@/lib/booking-window";
import { getStoreHoursForDate } from "@/lib/store-hours";

function isSequential(slots: number[]) {
  const sorted = [...slots].sort((a, b) => a - b);
  return sorted.every((slot, index) => {
    if (index === 0) return true;
    return slot === sorted[index - 1] + 1;
  });
}

async function generateBookingCode(bookingDate: string) {
  const datePart = bookingDate.replaceAll("-", "");
  let bookingCode = "";

  while (true) {
    const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
    bookingCode = `TFM-${datePart}-${randomPart}`;

    const existing = await prisma.booking.findUnique({
      where: { bookingCode },
      select: { id: true },
    });

    if (!existing) break;
  }

  return bookingCode;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function buildSlotDate(bookingDate: string, hour: number) {
  return new Date(`${bookingDate}T${pad(hour)}:00:00+07:00`);
}

function isOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && endA > startB;
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak." },
        { status: 403 }
      );
    }

    await expireOverdueBookings();

    const body = await request.json();
    const parsed = createManualBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ?? "Data manual booking tidak valid.",
        },
        { status: 400 }
      );
    }

    const {
      storeId,
      tableId,
      bookingDate,
      selectedSlots,
      customerName,
      customerPhone,
      customerEmail,
      notes,
      source,
      initialStatus,
    } = parsed.data;

    if (!isDateWithinBookingWindow(bookingDate)) {
      const { minDate, maxDate } = getBookingWindow();

      return NextResponse.json(
        {
          error: `Booking hanya bisa dibuat untuk tanggal ${minDate} sampai ${maxDate}.`,
        },
        { status: 400 }
      );
    }

    const normalizedSlots = [...new Set(selectedSlots)].sort((a, b) => a - b);

    if (!isSequential(normalizedSlots)) {
      return NextResponse.json(
        { error: "Slot jam harus berurutan." },
        { status: 400 }
      );
    }

    const firstSlot = normalizedSlots[0];
    const lastSlot = normalizedSlots[normalizedSlots.length - 1];

    const todayInJakarta = getTodayDateStringInJakarta();
    const currentHour = getCurrentHourInJakarta();

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

    const resolvedHours = getStoreHoursForDate(store, bookingDate);

    if (resolvedHours.isClosed) {
      return NextResponse.json(
        { error: "Store tutup pada tanggal yang dipilih." },
        { status: 400 }
      );
    }

    if (
      firstSlot < resolvedHours.openHour ||
      lastSlot + 1 > resolvedHours.closeHour
    ) {
      return NextResponse.json(
        {
          error: `Slot di luar jam operasional store (${String(
            resolvedHours.openHour
          ).padStart(2, "0")}:00 - ${String(resolvedHours.closeHour).padStart(
            2,
            "0"
          )}:00).`,
        },
        { status: 400 }
      );
    }

    if (bookingDate === todayInJakarta && firstSlot <= currentHour) {
      return NextResponse.json(
        {
          error:
            "Untuk hari ini, manual booking tidak bisa dibuat di slot yang sudah lewat atau sedang berjalan.",
        },
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

    const bookingDateValue = new Date(`${bookingDate}T00:00:00.000Z`);

    const requestedStart = buildSlotDate(bookingDate, firstSlot);
    const requestedEnd = buildSlotDate(bookingDate, lastSlot + 1);

    const [bookingSlots, activeWalkIns] = await Promise.all([
      prisma.bookingSlot.findMany({
        where: {
          tableId,
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
          tableId,
          bookingDate: bookingDateValue,
          status: "ACTIVE",
        },
        select: {
          id: true,
          startedAt: true,
          estimatedEndAt: true,
        },
      }),
    ]);

    const hasBookingConflict = bookingSlots.some((slot) => {
      const slotStart = buildSlotDate(bookingDate, slot.slotHour);
      const slotEnd = buildSlotDate(bookingDate, slot.slotEndHour);

      return isOverlap(requestedStart, requestedEnd, slotStart, slotEnd);
    });

    if (hasBookingConflict) {
      return NextResponse.json(
        { error: "Ada booking aktif yang bentrok dengan slot ini." },
        { status: 409 }
      );
    }

    const hasWalkInConflict = activeWalkIns.some((walkIn) =>
      isOverlap(
        requestedStart,
        requestedEnd,
        walkIn.startedAt,
        walkIn.estimatedEndAt
      )
    );

    if (hasWalkInConflict) {
      return NextResponse.json(
        { error: "Ada walk-in aktif yang bentrok dengan slot ini." },
        { status: 409 }
      );
    }

    const totalSlots = normalizedSlots.length;
    const totalPrice = totalSlots * PRICE_PER_HOUR;
    const bookingCode = await generateBookingCode(bookingDate);

    const isConfirmed = initialStatus === "CONFIRMED";
    const expiresAt = isConfirmed
      ? null
      : new Date(Date.now() + BOOKING_HOLD_MINUTES * 60 * 1000);

    const booking = await prisma.$transaction(
      async (tx) => {
        const createdBooking = await tx.booking.create({
          data: {
            bookingCode,
            userId: null,
            storeId,
            tableId,
            bookingType: "MAHJONG",
            status: initialStatus,
            source,
            customerName,
            customerPhone,
            customerEmail: customerEmail || null,
            bookingDate: bookingDateValue,
            startHour: firstSlot,
            endHour: lastSlot + 1,
            totalSlots,
            pricePerHour: PRICE_PER_HOUR,
            totalPrice,
            expiresAt,
            notes: notes || null,
            createdByAdmin: true,
            confirmedAt: isConfirmed ? new Date() : null,
          },
        });

        await tx.bookingSlot.createMany({
          data: normalizedSlots.map((slotHour) => ({
            bookingId: createdBooking.id,
            storeId,
            tableId,
            bookingDate: bookingDateValue,
            slotHour,
            slotEndHour: slotHour + 1,
            status: initialStatus,
          })),
        });

        await tx.bookingStatusLog.create({
          data: {
            bookingId: createdBooking.id,
            oldStatus: null,
            newStatus: initialStatus,
            note: isConfirmed
              ? `Manual booking dibuat admin dan langsung dikonfirmasi. Source: ${source}`
              : `Manual booking dibuat admin. Menunggu pembayaran. Source: ${source}`,
          },
        });

        return createdBooking;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
    });
  } catch (error) {
    console.error("Manual booking error:", error);

    return NextResponse.json(
      { error: "Gagal membuat manual booking." },
      { status: 500 }
    );
  }
}