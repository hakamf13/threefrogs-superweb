import { prisma } from "@/lib/prisma";
import { ACTIVE_BOOKING_STATUSES } from "@/lib/constants";
import { getTodayDateStringInJakarta } from "@/lib/booking-window";
import { expireOverdueBookings } from "./expire-overdue-bookings";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function buildSlotDate(dateText: string, hour: number) {
  return new Date(`${dateText}T${pad(hour)}:00:00+07:00`);
}

function isOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && endA > startB;
}

export async function getMahjongHealthCheck() {
  await expireOverdueBookings();

  const now = new Date();
  const today = getTodayDateStringInJakarta();
  const todayDateValue = new Date(`${today}T00:00:00.000Z`);

  const [
    activeStores,
    activeTables,
    activeWalkInSessions,
    overdueAwaitingPayment,
    bookingsWithoutSlots,
    confirmedWithoutConfirmedAt,
    todayBookingSlots,
  ] = await Promise.all([
    prisma.store.count({
      where: {
        isActive: true,
        category: "MAHJONG",
      },
    }),

    prisma.table.count({
      where: {
        isActive: true,
        store: {
          category: "MAHJONG",
          isActive: true,
        },
      },
    }),

    prisma.walkInSession.findMany({
      where: {
        status: "ACTIVE",
      },
      select: {
        id: true,
        tableId: true,
        storeId: true,
        customerName: true,
        startedAt: true,
        estimatedEndAt: true,
      },
    }),

    prisma.booking.count({
      where: {
        status: "AWAITING_PAYMENT",
        expiresAt: {
          lt: now,
        },
      },
    }),

    prisma.booking.findMany({
      where: {
        store: {
          category: "MAHJONG",
        },
      },
      include: {
        slots: {
          select: {
            id: true,
          },
        },
      },
    }),

    prisma.booking.count({
      where: {
        status: "CONFIRMED",
        confirmedAt: null,
        store: {
          category: "MAHJONG",
        },
      },
    }),

    prisma.bookingSlot.findMany({
      where: {
        bookingDate: todayDateValue,
        status: {
          in: [...ACTIVE_BOOKING_STATUSES],
        },
      },
      select: {
        id: true,
        tableId: true,
        slotHour: true,
        slotEndHour: true,
        bookingId: true,
      },
    }),
  ]);

  const walkInByTable = new Map<string, typeof activeWalkInSessions>();

  for (const session of activeWalkInSessions) {
    const existing = walkInByTable.get(session.tableId) ?? [];
    existing.push(session);
    walkInByTable.set(session.tableId, existing);
  }

  const duplicateActiveWalkIns = Array.from(walkInByTable.entries())
    .filter(([, sessions]) => sessions.length > 1)
    .map(([tableId, sessions]) => ({
      tableId,
      sessionCount: sessions.length,
      sessionIds: sessions.map((session) => session.id),
    }));

  const bookingsWithoutSlotsCount = bookingsWithoutSlots.filter(
    (booking) =>
      booking.status !== "CANCELLED" &&
      booking.status !== "EXPIRED" &&
      booking.slots.length === 0
  ).length;

  const walkInConflictsWithBooking = activeWalkInSessions.filter((session) =>
    todayBookingSlots.some((slot) => {
      if (slot.tableId !== session.tableId) return false;

      const slotStart = buildSlotDate(today, slot.slotHour);
      const slotEnd = buildSlotDate(today, slot.slotEndHour);

      return isOverlap(
        session.startedAt,
        session.estimatedEndAt,
        slotStart,
        slotEnd
      );
    })
  );

  const summary = {
    activeStores,
    activeTables,
    walkInSessions: activeWalkInSessions.length,
    overdueAwaitingPayment,
    bookingsWithoutSlots: bookingsWithoutSlotsCount,
    confirmedWithoutConfirmedAt,
    duplicateActiveWalkIns: duplicateActiveWalkIns.length,
    walkInConflictsWithBooking: walkInConflictsWithBooking.length,
  };

  const checks = [
    {
      key: "stores_ready",
      label: "Store Mahjong aktif tersedia",
      status: activeStores > 0 ? "PASS" : "FAIL",
      detail:
        activeStores > 0
          ? `${activeStores} store aktif terdeteksi.`
          : "Belum ada store mahjong aktif.",
    },
    {
      key: "tables_ready",
      label: "Meja aktif tersedia",
      status: activeTables > 0 ? "PASS" : "FAIL",
      detail:
        activeTables > 0
          ? `${activeTables} meja aktif terdeteksi.`
          : "Belum ada meja aktif untuk store mahjong.",
    },
    {
      key: "no_overdue_awaiting_payment",
      label: "Tidak ada booking overdue yang masih awaiting payment",
      status: overdueAwaitingPayment === 0 ? "PASS" : "WARN",
      detail:
        overdueAwaitingPayment === 0
          ? "Tidak ada overdue booking tertahan."
          : `${overdueAwaitingPayment} booking masih awaiting payment meski sudah lewat expiry.`,
    },
    {
      key: "no_booking_without_slots",
      label: "Booking aktif punya slot",
      status: bookingsWithoutSlotsCount === 0 ? "PASS" : "FAIL",
      detail:
        bookingsWithoutSlotsCount === 0
          ? "Semua booking aktif punya slot."
          : `${bookingsWithoutSlotsCount} booking aktif tidak punya booking slot.`,
    },
    {
      key: "confirmed_has_confirmed_at",
      label: "Booking confirmed punya confirmedAt",
      status: confirmedWithoutConfirmedAt === 0 ? "PASS" : "WARN",
      detail:
        confirmedWithoutConfirmedAt === 0
          ? "Semua booking confirmed punya timestamp konfirmasi."
          : `${confirmedWithoutConfirmedAt} booking confirmed belum punya confirmedAt.`,
    },
    {
      key: "no_duplicate_walk_in",
      label: "Tidak ada walk-in ganda di meja yang sama",
      status: duplicateActiveWalkIns.length === 0 ? "PASS" : "FAIL",
      detail:
        duplicateActiveWalkIns.length === 0
          ? "Tidak ada meja dengan lebih dari satu walk-in aktif."
          : `${duplicateActiveWalkIns.length} meja punya walk-in ganda.`,
    },
    {
      key: "no_walk_in_booking_conflict",
      label: "Walk-in tidak bentrok dengan booking aktif hari ini",
      status: walkInConflictsWithBooking.length === 0 ? "PASS" : "WARN",
      detail:
        walkInConflictsWithBooking.length === 0
          ? "Tidak ada bentrok walk-in dengan booking aktif/berikutnya."
          : `${walkInConflictsWithBooking.length} walk-in bentrok dengan booking.`,
    },
  ] as const;

  return {
    now,
    today,
    summary,
    checks,
    details: {
      duplicateActiveWalkIns,
      walkInConflictsWithBooking: walkInConflictsWithBooking.map((session) => ({
        sessionId: session.id,
        tableId: session.tableId,
        customerName: session.customerName,
        startedAt: session.startedAt,
        estimatedEndAt: session.estimatedEndAt,
      })),
    },
  };
}