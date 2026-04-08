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
    },
  });

  if (overdueBookings.length === 0) {
    return 0;
  }

  const bookingIds = overdueBookings.map((booking) => booking.id);

  await prisma.$transaction([
    prisma.booking.updateMany({
      where: {
        id: { in: bookingIds },
        status: "AWAITING_PAYMENT",
      },
      data: {
        status: "EXPIRED",
        paymentExpiredAt: now,
      },
    }),
    prisma.bookingSlot.updateMany({
      where: {
        bookingId: { in: bookingIds },
        status: "AWAITING_PAYMENT",
      },
      data: {
        status: "EXPIRED",
      },
    }),
    prisma.bookingStatusLog.createMany({
      data: bookingIds.map((bookingId) => ({
        bookingId,
        oldStatus: "AWAITING_PAYMENT",
        newStatus: "EXPIRED",
        note: "Booking expired otomatis karena melewati batas waktu pembayaran.",
      })),
    }),
  ]);

  return bookingIds.length;
}

/*import { prisma } from "../../lib/prisma";

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
}*/