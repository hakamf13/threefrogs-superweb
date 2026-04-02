import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "../../../../../../lib/prisma";

type RouteContext = {
  params: Promise<{
    bookingCode: string;
  }>;
};

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Kamu harus login dulu." },
        { status: 401 }
      );
    }

    const { bookingCode } = await context.params;

    const booking = await prisma.booking.findFirst({
      where: {
        bookingCode,
        userId: session.user.id,
      },
      select: {
        id: true,
        status: true,
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
        { error: "Booking ini tidak bisa dibatalkan oleh user." },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: {
          id: booking.id,
        },
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
          rejectionReason: "Booking dibatalkan oleh user.",
        },
      });

      await tx.bookingStatusLog.create({
        data: {
          bookingId: booking.id,
          oldStatus: booking.status,
          newStatus: "CANCELLED",
          note: "Booking dibatalkan oleh user.",
        },
      });
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Cancel booking by user error:", error);

    return NextResponse.json(
      { error: "Gagal membatalkan booking." },
      { status: 500 }
    );
  }
}