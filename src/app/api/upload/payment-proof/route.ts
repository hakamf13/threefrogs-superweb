import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { bookingCode, fileUrl, fileName, fileSize, mimeType } = body as {
      bookingCode?: string;
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
    };

    if (!bookingCode || !fileUrl) {
      return NextResponse.json(
        { error: "bookingCode dan fileUrl wajib diisi." },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: {
        bookingCode,
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
        {
          error:
            "Booking ini tidak bisa upload bukti pembayaran pada status sekarang.",
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.paymentProof.updateMany({
        where: {
          bookingId: booking.id,
          verificationStatus: "PENDING",
        },
        data: {
          verificationStatus: "SUPERSEDED",
          rejectionReason: "Digantikan oleh upload ulang user.",
        },
      });

      await tx.paymentProof.create({
        data: {
          bookingId: booking.id,
          fileUrl,
          fileName: fileName || null,
          fileSize: typeof fileSize === "number" ? fileSize : null,
          mimeType: mimeType || null,
          verificationStatus: "PENDING",
        },
      });

      if (booking.status === "AWAITING_PAYMENT") {
        await tx.booking.update({
          where: {
            id: booking.id,
          },
          data: {
            status: "PENDING_VERIFICATION",
          },
        });

        await tx.bookingSlot.updateMany({
          where: {
            bookingId: booking.id,
          },
          data: {
            status: "PENDING_VERIFICATION",
          },
        });

        await tx.bookingStatusLog.create({
          data: {
            bookingId: booking.id,
            oldStatus: "AWAITING_PAYMENT",
            newStatus: "PENDING_VERIFICATION",
            note: "User mengupload bukti pembayaran.",
          },
        });
      } else {
        await tx.bookingStatusLog.create({
          data: {
            bookingId: booking.id,
            oldStatus: "PENDING_VERIFICATION",
            newStatus: "PENDING_VERIFICATION",
            note: "User mengupload ulang bukti pembayaran.",
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Save payment proof metadata error:", error);

    return NextResponse.json(
      { error: "Gagal menyimpan bukti pembayaran." },
      { status: 500 }
    );
  }
}