import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "../../../../../lib/prisma";
import {
  ACTIVE_BOOKING_STATUSES,
  BOOKING_HOLD_MINUTES,
  CLOSE_HOUR,
  OPEN_HOUR,
  PRICE_PER_HOUR,
} from "../../../../../lib/constants";
import { createManualBookingSchema } from "../../../../../lib/validations";
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
      },
    });

    if (conflicts.length > 0) {
      return NextResponse.json(
        { error: "Ada slot yang sudah terisi." },
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