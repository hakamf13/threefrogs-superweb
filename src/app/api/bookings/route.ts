import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../../lib/prisma";
import { auth } from "@/auth";
import {
  ACTIVE_BOOKING_STATUSES,
  BOOKING_HOLD_MINUTES,
  CLOSE_HOUR,
  OPEN_HOUR,
  PRICE_PER_HOUR,
} from "../../../../lib/constants";
import { createBookingSchema } from "../../../../lib/validations";
import { expireOverdueBookings } from "@/features/reservations/expire-overdue-bookings";

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

export async function POST(request: Request) {
  try {
    const session = await auth();
    await expireOverdueBookings();

    const body = await request.json();
    const parsed = createBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Data booking tidak valid.",
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
    } = parsed.data;

    const normalizedSlots = [...new Set(selectedSlots)].sort((a, b) => a - b);

    if (!isSequential(normalizedSlots)) {
      return NextResponse.json(
        { error: "Slot jam harus berurutan." },
        { status: 400 }
      );
    }

    const firstSlot = normalizedSlots[0];
    const lastSlot = normalizedSlots[normalizedSlots.length - 1];

    if (firstSlot < OPEN_HOUR || lastSlot + 1 > CLOSE_HOUR) {
      return NextResponse.json(
        { error: "Slot di luar jam operasional." },
        { status: 400 }
      );
    }

    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        isActive: true,
        category: "MAHJONG",
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Store tidak ditemukan." },
        { status: 404 }
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
        tableNumber: true,
      },
    });

    if (!table) {
      return NextResponse.json(
        { error: "Meja tidak ditemukan." },
        { status: 404 }
      );
    }

    const bookingDateValue = new Date(`${bookingDate}T00:00:00.000Z`);

    const conflicts = await prisma.bookingSlot.findMany({
      where: {
        tableId,
        bookingDate: bookingDateValue,
        slotHour: {
          in: normalizedSlots,
        },
        status: {
          in: [...ACTIVE_BOOKING_STATUSES],
        },
      },
      select: {
        id: true,
        slotHour: true,
      },
    });

    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          error: "Ada slot yang barusan sudah terisi. Coba pilih ulang ya.",
        },
        { status: 409 }
      );
    }

    const totalSlots = normalizedSlots.length;
    const totalPrice = totalSlots * PRICE_PER_HOUR;
    const bookingCode = await generateBookingCode(bookingDate);
    const expiresAt = new Date(Date.now() + BOOKING_HOLD_MINUTES * 60 * 1000);

    const userId = session?.user?.id || null;

    const booking = await prisma.$transaction(
      async (tx) => {
        const createdBooking = await tx.booking.create({
          data: {
            bookingCode,
            userId,
            storeId,
            tableId,
            bookingType: "MAHJONG",
            status: "AWAITING_PAYMENT",
            source: "ONLINE",
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
            status: "AWAITING_PAYMENT",
          })),
        });

        await tx.bookingStatusLog.create({
          data: {
            bookingId: createdBooking.id,
            oldStatus: null,
            newStatus: "AWAITING_PAYMENT",
            note: userId
              ? "Booking dibuat oleh user login."
              : "Booking dibuat oleh guest/user tanpa login.",
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
      bookingCode: booking.bookingCode,
    });
  } catch (error) {
    console.error("Create booking error:", error);

    return NextResponse.json(
      { error: "Terjadi kesalahan saat membuat booking." },
      { status: 500 }
    );
  }
}