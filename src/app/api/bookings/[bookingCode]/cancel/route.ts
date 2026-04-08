import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const CANCELLABLE_STATUSES = [
  "AWAITING_PAYMENT",
  "PENDING_VERIFICATION",
  "CONFIRMED",
] as const;

export async function POST(
  request: Request,
  context: { params: Promise<{ bookingCode: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Kamu harus login dulu." },
        { status: 401 }
      );
    }

    const { bookingCode } = await context.params;
    const body = await request.json().catch(() => ({}));
    const reason =
      typeof body?.reason === "string" ? body.reason.trim() : "";

    const booking = await prisma.booking.findUnique({
      where: { bookingCode },
      select: {
        id: true,
        userId: true,
        status: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking tidak ditemukan." },
        { status: 404 }
      );
    }

    const isAdmin = session.user.role === "ADMIN";
    const isOwner = booking.userId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "Kamu tidak punya akses ke booking ini." },
        { status: 403 }
      );
    }

    if (
      !CANCELLABLE_STATUSES.includes(
        booking.status as (typeof CANCELLABLE_STATUSES)[number]
      )
    ) {
      return NextResponse.json(
        { error: "Booking pada status ini tidak bisa dibatalkan." },
        { status: 400 }
      );
    }

    const note = reason
      ? isAdmin
        ? `Booking dibatalkan admin. Alasan: ${reason}`
        : `Booking dibatalkan customer. Alasan: ${reason}`
      : isAdmin
      ? "Booking dibatalkan admin."
      : "Booking dibatalkan customer.";

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
        },
      });

      await tx.bookingSlot.updateMany({
        where: {
          bookingId: booking.id,
          status: {
            in: [
              "AWAITING_PAYMENT",
              "PENDING_VERIFICATION",
              "CONFIRMED",
            ],
          },
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
          verificationStatus: "SUPERSEDED",
          rejectionReason: "Booking dibatalkan.",
        },
      });

      await tx.bookingStatusLog.create({
        data: {
          bookingId: booking.id,
          oldStatus: booking.status,
          newStatus: "CANCELLED",
          changedByUserId: session.user.id,
          note,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Booking berhasil dibatalkan.",
    });
  } catch (error) {
    console.error("Cancel booking error:", error);

    return NextResponse.json(
      { error: "Gagal membatalkan booking." },
      { status: 500 }
    );
  }
}

/*
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "../../../../../lib/prisma";

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
}*/