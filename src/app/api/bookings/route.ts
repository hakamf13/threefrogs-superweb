import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { auth } from "@/auth";
import { expireOverdueBookings } from "@/features/reservations/expire-overdue-bookings";
import {
  ACTIVE_BOOKING_STATUSES,
  BOOKING_HOLD_MINUTES,
  CLOSE_HOUR,
  OPEN_HOUR,
  PRICE_PER_HOUR,
} from "../../../lib/constants";
import { createBookingSchema } from "../../../lib/validations";
import {
  getBookingWindow,
  isDateWithinBookingWindow,
  getCurrentHourInJakarta,
  getTodayDateStringInJakarta,
} from "@/lib/booking-window";
import { notifyAdminsBookingCreated } from "@/lib/admin-notifications";
import { enforceRouteRateLimit } from "@/lib/rate-limit";
import { isMidtransConfigured } from "@/lib/midtrans";
import { generateMidtransOrderId } from "@/features/payments/generate-midtrans-order-id";
import { createMidtransSnapTransaction } from "@/features/payments/create-midtrans-snap-transaction";
import { updateBookingPaymentRequest } from "@/features/payments/update-booking-payment-request";

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

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Kamu harus login dulu." },
        { status: 401 }
      );
    }

    const rateLimitResponse = await enforceRouteRateLimit({
      request,
      scope: "bookingCreate",
      identifier: session.user.id,
    });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    await expireOverdueBookings();

    const currentUser = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        isActive: true,
      },
    });

    if (!currentUser || !currentUser.isActive) {
      return NextResponse.json(
        { error: "Akun user tidak ditemukan atau tidak aktif." },
        { status: 403 }
      );
    }

    if (!currentUser.name || !currentUser.phone) {
      return NextResponse.json(
        { error: "Profil kamu belum lengkap. Nama dan nomor HP wajib ada." },
        { status: 400 }
      );
    }

    const customerName = currentUser.name;
    const customerPhone = currentUser.phone;

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

    const { storeId, tableId, bookingDate, selectedSlots, notes } = parsed.data;

    if (!isDateWithinBookingWindow(bookingDate)) {
      const { minDate, maxDate } = getBookingWindow();

      return NextResponse.json(
        {
          error: `Reservasi hanya bisa dibuat untuk tanggal ${minDate} sampai ${maxDate}.`,
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

    if (firstSlot < OPEN_HOUR || lastSlot + 1 > CLOSE_HOUR) {
      return NextResponse.json(
        { error: "Slot di luar jam operasional." },
        { status: 400 }
      );
    }

    const todayInJakarta = getTodayDateStringInJakarta();
    const currentHour = getCurrentHourInJakarta();

    if (bookingDate === todayInJakarta && firstSlot <= currentHour) {
      return NextResponse.json(
        {
          error:
            "Untuk hari ini, slot yang sudah lewat atau sedang berjalan tidak bisa dibooking lagi.",
        },
        { status: 400 }
      );
    }

    // Test 
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
        displayLabel: true,
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

    const booking = await prisma.$transaction(
      async (tx) => {
        const createdBooking = await tx.booking.create({
          data: {
            bookingCode,
            userId: currentUser.id,
            storeId,
            tableId,
            bookingType: "MAHJONG",
            status: "AWAITING_PAYMENT",
            source: "ONLINE",
            customerName: currentUser.name!,
            customerPhone: currentUser.phone!,
            customerEmail: currentUser.email || null,
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
            note: "Booking dibuat oleh user login.",
          },
        });

        return createdBooking;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    let paymentResult: {
      checkoutUrl: string | null;
      gatewayToken: string | null;
      gatewayStatus: string | null;
    } | null = null;

    if (isMidtransConfigured()) {
      try {
        const orderId = generateMidtransOrderId(booking.bookingCode);

        const snapTransaction = await createMidtransSnapTransaction({
          orderId,
          grossAmount: booking.totalPrice,
          bookingCode: booking.bookingCode,
          customer: {
            firstName: booking.customerName,
            email: booking.customerEmail,
            phone: booking.customerPhone,
          },
        });

        await updateBookingPaymentRequest({
          bookingId: booking.id,
          paymentReferenceId: orderId,
          paymentMethodCode: "MIDTRANS_SNAP",
          gatewayStatus: "TOKEN_CREATED",
          gatewayToken: snapTransaction.token ?? null,
          checkoutUrl: snapTransaction.redirect_url ?? null,
          actionType: "REDIRECT_CUSTOMER",
          actionDescriptor: "SNAP_REDIRECT",
          actionValue: snapTransaction.redirect_url ?? null,
          payload: snapTransaction,
        });

        paymentResult = {
          checkoutUrl: snapTransaction.redirect_url ?? null,
          gatewayToken: snapTransaction.token ?? null,
          gatewayStatus: "TOKEN_CREATED",
        };
      } catch (paymentError) {
        console.error("Create Midtrans Snap transaction error:", paymentError);
      }
    }

    try {
      await notifyAdminsBookingCreated({
        bookingCode: booking.bookingCode,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerEmail: booking.customerEmail,
        storeName: store.name,
        tableLabel: table.displayLabel || `Meja ${table.tableNumber}`,
        bookingDate: booking.bookingDate,
        slotHours: normalizedSlots,
        totalPrice: booking.totalPrice,
        paymentMode: paymentResult ? "MIDTRANS" : "MANUAL",
      });
    } catch (error) {
      console.error("Notify admins booking created error:", error);
    }

    return NextResponse.json({
      success: true,
      bookingCode: booking.bookingCode,
      payment: paymentResult,
    });
  } catch (error) {
    console.error("Create booking error:", error);

    return NextResponse.json(
      { error: "Terjadi kesalahan saat membuat booking." },
      { status: 500 }
    );
  }
}