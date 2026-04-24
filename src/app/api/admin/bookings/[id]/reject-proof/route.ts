import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BOOKING_HOLD_MINUTES } from "@/lib/constants";
import { requireAdminSession } from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { session, response } = await requireAdminSession();

    if (response) {
      return response;
    }

    const { id } = await context.params;

    const body = await request.json().catch(() => ({}));

    const reason =
      typeof body?.reason === "string" && body.reason.trim().length > 0
        ? body.reason.trim()
        : "Bukti pembayaran ditolak admin.";

    const booking = await prisma.booking.findUnique({
      where: {
        id,
      },
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

    if (booking.paymentGatewayProvider === "MIDTRANS") {
      return NextResponse.json(
        {
          error:
            "Booking Midtrans tidak memakai review bukti bayar manual, jadi tidak bisa direject dari sini.",
        },
        { status: 400 }
      );
    }

    if (booking.status !== "PENDING_VERIFICATION") {
      return NextResponse.json(
        { error: "Booking ini tidak sedang menunggu verifikasi." },
        { status: 400 }
      );
    }

    const latestPendingProof = booking.paymentProofs.find(
      (proof) => proof.verificationStatus === "PENDING"
    );

    if (!latestPendingProof) {
      return NextResponse.json(
        { error: "Tidak ada bukti pembayaran pending untuk ditolak." },
        { status: 400 }
      );
    }

    const newExpiresAt = new Date(
      Date.now() + BOOKING_HOLD_MINUTES * 60 * 1000
    );

    await prisma.$transaction(async (tx) => {
      await tx.paymentProof.update({
        where: {
          id: latestPendingProof.id,
        },
        data: {
          verificationStatus: "REJECTED",
          rejectionReason: reason,
        },
      });

      await tx.booking.update({
        where: {
          id: booking.id,
        },
        data: {
          status: "AWAITING_PAYMENT",
          expiresAt: newExpiresAt,
          confirmedAt: null,
        },
      });

      await tx.bookingSlot.updateMany({
        where: {
          bookingId: booking.id,
        },
        data: {
          status: "AWAITING_PAYMENT",
        },
      });

      await tx.bookingStatusLog.create({
        data: {
          bookingId: booking.id,
          oldStatus: "PENDING_VERIFICATION",
          newStatus: "AWAITING_PAYMENT",
          changedByUserId: session.user.id,
          note: `Bukti pembayaran ditolak admin.\nAlasan: ${reason}`,
        },
      });
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Reject payment proof error:", error);

    return NextResponse.json(
      { error: "Gagal menolak bukti pembayaran." },
      { status: 500 }
    );
  }
}