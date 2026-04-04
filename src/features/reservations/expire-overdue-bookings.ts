import { prisma } from "../../lib/prisma";

export async function expireOverdueBookings() {
  const now = new Date();

  const overdueBookings = await prisma.booking.findMany({
    where: {
      status: "AWAITING_PAYMENT",
      expiresAt: {
        lt: now,
      },
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (overdueBookings.length === 0) {
    return 0;
  }

  for (const booking of overdueBookings) {
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: {
          id: booking.id,
        },
        data: {
          status: "EXPIRED",
        },
      });

      await tx.bookingSlot.updateMany({
        where: {
          bookingId: booking.id,
        },
        data: {
          status: "EXPIRED",
        },
      });

      await tx.bookingStatusLog.create({
        data: {
          bookingId: booking.id,
          oldStatus: booking.status,
          newStatus: "EXPIRED",
          note: "Booking expired otomatis karena melewati batas waktu pembayaran.",
        },
      });
    });
  }

  return overdueBookings.length;
}