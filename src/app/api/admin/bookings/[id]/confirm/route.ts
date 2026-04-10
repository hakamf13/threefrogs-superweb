import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "../../../../../../lib/prisma";
import { sendCustomerBookingStatusChangedNotification } from "@/lib/notifications/booking-notifications";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    const note =
      typeof body?.note === "string" && body.note.trim().length > 0
        ? body.note.trim()
        : "Booking dikonfirmasi langsung oleh admin.";

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        paymentProofs: {
          orderBy: {
            uploadedAt: "desc",
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking tidak ditemukan." },
        { status: 404 }
      );
    }

    if (
      booking.status !== "AWAITING_PAYMENT" &&
      booking.status !== "PENDING_VERIFICATION"
    ) {
      return NextResponse.json(
        { error: "Booking ini tidak bisa dikonfirmasi langsung." },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: "CONFIRMED",
          confirmedAt: new Date(),
          cancelledAt: null,
          expiresAt: null,
        },
      });

      await tx.bookingSlot.updateMany({
        where: {
          bookingId: booking.id,
        },
        data: {
          status: "CONFIRMED",
        },
      });

      await tx.paymentProof.updateMany({
        where: {
          bookingId: booking.id,
          verificationStatus: "PENDING",
        },
        data: {
          verificationStatus: "APPROVED",
          verifiedAt: new Date(),
          rejectionReason: null,
        },
      });

      await tx.bookingStatusLog.create({
        data: {
          bookingId: booking.id,
          oldStatus: booking.status,
          newStatus: "CONFIRMED",
          changedByUserId: session.user.id,
          note,
        },
      });
    });

    void sendCustomerBookingStatusChangedNotification({
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      statusLabel: "Booking terkonfirmasi",
      note,
    }).catch(console.error);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Direct confirm booking error:", error);

    return NextResponse.json(
      { error: "Gagal mengonfirmasi booking langsung." },
      { status: 500 }
    );
  }
}