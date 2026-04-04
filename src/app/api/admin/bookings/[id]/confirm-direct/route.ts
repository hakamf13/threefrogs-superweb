import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
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
          note,
        },
      });
    });

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