import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "../../../../../../lib/prisma";
import { sendCustomerBookingStatusChangedNotification } from "@/lib/notifications/booking-notifications";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const { id } = await context.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        bookingCode: true,
        customerName: true,
        customerEmail: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking tidak ditemukan." },
        { status: 404 }
      );
    }

    if (booking.status === "CANCELLED" || booking.status === "EXPIRED") {
      return NextResponse.json(
        { error: "Booking ini sudah tidak aktif." },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          confirmedAt: null,
        },
      });

      await tx.bookingSlot.updateMany({
        where: {
          bookingId: booking.id,
        },
        data: {
          status: "CANCELLED",
        },
      });

      await tx.paymentProof.updateMany({
        where: {
          bookingId: booking.id,
          verificationStatus: "PENDING",
        },
        data: {
          verificationStatus: "REJECTED",
          rejectionReason: "Booking dibatalkan oleh admin.",
        },
      });

      await tx.bookingStatusLog.create({
        data: {
          bookingId: booking.id,
          oldStatus: booking.status,
          newStatus: "CANCELLED",
          changedByUserId: session.user.id,
          note: "Booking dibatalkan admin.",
        },
      });
    });

    void sendCustomerBookingStatusChangedNotification({
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      statusLabel: "Booking dibatalkan",
      note: "Booking dibatalkan oleh admin.",
    }).catch(console.error);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Cancel booking error:", error);

    return NextResponse.json(
      { error: "Gagal membatalkan booking." },
      { status: 500 }
    );
  }
}