import { prisma } from "@/lib/prisma";
import { ACTIVE_BOOKING_STATUSES } from "@/lib/constants";
import {
	getCurrentHourInJakarta,
	getTodayDateStringInJakarta,
} from "@/lib/booking-window";
import { expireOverdueBookings } from "./expire-overdue-bookings";

export async function getMahjongHealthCheck() {
	await expireOverdueBookings();

	const now = new Date();
	const today = getTodayDateStringInJakarta();
	const currentHour = getCurrentHourInJakarta();
	const todayDateValue = new Date(`${today}T00:00:00.000Z`);

	const [
		activeStores,
		activeTables,
		openSessions,
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

		prisma.openTableSession.findMany({
			where: {
				status: "OPEN",
			},
			select: {
				id: true,
				tableId: true,
				storeId: true,
				openedAt: true,
				customerName: true,
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

	const openTableByTable = new Map<string, typeof openSessions>();
	for (const session of openSessions) {
		const existing = openTableByTable.get(session.tableId) ?? [];
		existing.push(session);
		openTableByTable.set(session.tableId, existing);
	}

	const duplicateOpenTables = Array.from(openTableByTable.entries())
		.filter(([, sessions]) => sessions.length > 1)
		.map(([tableId, sessions]) => ({
			tableId,
			sessionCount: sessions.length,
			sessionIds: sessions.map((s) => s.id),
		}));

	const bookingsWithoutSlotsCount = bookingsWithoutSlots.filter(
		(booking) =>
			booking.status !== "CANCELLED" &&
			booking.status !== "EXPIRED" &&
			booking.slots.length === 0
	).length;

	const openTableConflictsWithBooking = openSessions.filter((session) =>
		todayBookingSlots.some(
			(slot) => slot.tableId === session.tableId && slot.slotEndHour > currentHour
		)
	);

	const summary = {
		activeStores,
		activeTables,
		openSessions: openSessions.length,
		overdueAwaitingPayment,
		bookingsWithoutSlots: bookingsWithoutSlotsCount,
		confirmedWithoutConfirmedAt,
		duplicateOpenTables: duplicateOpenTables.length,
		openTableConflictsWithBooking: openTableConflictsWithBooking.length,
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
			key: "no_duplicate_open_table",
			label: "Tidak ada double open table di meja yang sama",
			status: duplicateOpenTables.length === 0 ? "PASS" : "FAIL",
			detail:
				duplicateOpenTables.length === 0
					? "Tidak ada meja dengan lebih dari satu open table aktif."
					: `${duplicateOpenTables.length} meja punya open table ganda.`,
		},
		{
			key: "no_open_table_booking_conflict",
			label: "Open table tidak bentrok dengan booking sisa hari ini",
			status: openTableConflictsWithBooking.length === 0 ? "PASS" : "WARN",
			detail:
				openTableConflictsWithBooking.length === 0
					? "Tidak ada bentrok open table dengan booking aktif/berikutnya."
					: `${openTableConflictsWithBooking.length} open table bentrok dengan booking hari ini.`,
		},
	] as const;

	return {
		now,
		today,
		currentHour,
		summary,
		checks,
		details: {
			duplicateOpenTables,
			openTableConflictsWithBooking: openTableConflictsWithBooking.map((session) => ({
				sessionId: session.id,
				tableId: session.tableId,
				customerName: session.customerName,
				openedAt: session.openedAt,
			})),
		},
	};
}