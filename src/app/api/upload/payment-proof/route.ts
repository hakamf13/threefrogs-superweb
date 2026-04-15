import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendAdminPaymentProofUploadedNotification } from "@/lib/notifications/booking-notifications";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function isAllowedCloudinaryUrl(fileUrl: string) {
  try {
    const url = new URL(fileUrl);

    if (url.protocol !== "https:") return false;
    if (url.hostname !== "res.cloudinary.com") return false;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
    if (!cloudName) return true;

    return url.pathname.startsWith(`/${cloudName}/`);
  } catch {
    return false;
  }
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

    if (!isAllowedCloudinaryUrl(fileUrl)) {
      return NextResponse.json(
        { error: "URL file tidak valid." },
        { status: 400 }
      );
    }

    if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: "Tipe file tidak didukung." },
        { status: 400 }
      );
    }

    if (typeof fileSize === "number" && fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Ukuran file maksimal 5 MB." },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { bookingCode },
      select: {
        id: true,
        userId: true,
        status: true,
        customerName: true,
        paymentGatewayProvider: true,
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

    if (booking.paymentGatewayProvider === "MIDTRANS") {
      return NextResponse.json(
        {
          error:
            "Booking ini memakai Midtrans. Bukti pembayaran manual tidak bisa diupload.",
        },
        { status: 400 }
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
          where: { id: booking.id },
          data: { status: "PENDING_VERIFICATION" },
        });

        await tx.bookingSlot.updateMany({
          where: { bookingId: booking.id },
          data: { status: "PENDING_VERIFICATION" },
        });

        await tx.bookingStatusLog.create({
          data: {
            bookingId: booking.id,
            oldStatus: "AWAITING_PAYMENT",
            newStatus: "PENDING_VERIFICATION",
            changedByUserId: session.user.id,
            note: "User mengupload bukti pembayaran.",
          },
        });
      } else {
        await tx.bookingStatusLog.create({
          data: {
            bookingId: booking.id,
            oldStatus: "PENDING_VERIFICATION",
            newStatus: "PENDING_VERIFICATION",
            changedByUserId: session.user.id,
            note: "User mengupload ulang bukti pembayaran.",
          },
        });
      }
    });

    void sendAdminPaymentProofUploadedNotification({
      bookingId: booking.id,
      bookingCode,
      customerName: booking.customerName,
    }).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save payment proof metadata error:", error);

    return NextResponse.json(
      { error: "Gagal menyimpan bukti pembayaran." },
      { status: 500 }
    );
  }
}