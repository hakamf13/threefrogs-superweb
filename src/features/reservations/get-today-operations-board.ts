import { prisma } from "@/lib/prisma";
import { ACTIVE_BOOKING_STATUSES } from "@/lib/constants";
import {
	getCurrentHourInJakarta,
	getTodayDateStringInJakarta,
} from "@/lib/booking-window";
import { expireOverdueBookings } from "./expire-overdue-bookings";

export type TodayTableBoardStatus =
	| "OPEN_TABLE"
	| "BOOKED_NOW"
	| "UPCOMING_BOOKING"
	| "FREE";

export type TodayOperationsBoardData = {
	today: string;
	currentHour: number;
	summary: {
		totalTables: number;
		openTableCount: number;
		bookedNowCount: number;
		upcomingCount: number;
		freeCount: number;
	};
	stores: Array<{
		id: string;
		name: string;
		tables: Array<{
			id: string;
			tableNumber: number;
			tableCode: string | null;
			capacity: number | null;
			currentStatus: TodayTableBoardStatus;
			openTable: {
				sessionId: string;
				customerName: string;
				customerPhone: string | null;
				openedAt: Date;
			} | null;
			currentBooking: {
				bookingId: string;
				bookingCode: string;
				customerName: string;
				customerPhone: string;
				slotHour: number;
				slotEndHour: number;
			} | null;
			nextBooking: {
				bookingId: string;
				bookingCode: string;
				customerName: string;
				customerPhone: string;
				slotHour: number;
				slotEndHour: number;
			} | null;
		}>;
	}>;
};

export async function getTodayOperationsBoard(): Promise<TodayOperationsBoardData> {
	await expireOverdueBookings();

	const today = getTodayDateStringInJakarta();
	const currentHour = getCurrentHourInJakarta();
	const bookingDateValue = new Date(`${today}T00:00:00.000Z`);

	const [stores, bookingSlots, openSessions] = await Promise.all([
		prisma.store.findMany({
			where: {
				isActive: true,
				category: "MAHJONG",
			},
			orderBy: {
				createdAt: "asc",
			},
			include: {
				tables: {
					where: {
						isActive: true,
					},
					orderBy: {
						tableNumber: "asc",
					},
					select: {
						id: true,
						tableNumber: true,
						tableCode: true,
						capacity: true,
					},
				},
			},
		}),

		prisma.bookingSlot.findMany({
			where: {
				bookingDate: bookingDateValue,
				status: {
					in: [...ACTIVE_BOOKING_STATUSES],
				},
			},
			include: {
				booking: {
					select: {
						id: true,
						bookingCode: true,
						customerName: true,
						customerPhone: true,
						status: true,
					},
				},
			},
		}),

		prisma.openTableSession.findMany({
			where: {
				status: "OPEN",
			},
			include: {
				store: {
					select: {
						id: true,
					},
				},
				table: {
					select: {
						id: true,
					},
				},
			},
		}),
	]);

	const openTableMap = new Map<
		string,
		{
			sessionId: string;
			customerName: string;
			customerPhone: string | null;
			openedAt: Date;
		}
	>();

	for (const session of openSessions) {
		openTableMap.set(session.tableId, {
			sessionId: session.id,
			customerName: session.customerName,
			customerPhone: session.customerPhone,
			openedAt: session.openedAt,
		});
	}

	const currentBookingMap = new Map<
		string,
		{
			bookingId: string;
			bookingCode: string;
			customerName: string;
			customerPhone: string;
			slotHour: number;
			slotEndHour: number;
		}
	>();

	const nextBookingMap = new Map<
		string,
		{
			bookingId: string;
			bookingCode: string;
			customerName: string;
			customerPhone: string;
			slotHour: number;
			slotEndHour: number;
		}
	>();
// Test
	for (const slot of bookingSlots) {
		const isCurrent =
			slot.slotHour <= currentHour && slot.slotEndHour > currentHour;
		const isUpcoming = slot.slotHour > currentHour;

		if (isCurrent) {
			currentBookingMap.set(slot.tableId, {
				bookingId: slot.booking.id,
				bookingCode: slot.booking.bookingCode,
				customerName: slot.booking.customerName,
				customerPhone: slot.booking.customerPhone ?? "-",
				slotHour: slot.slotHour,
				slotEndHour: slot.slotEndHour,
			});
			continue;
		}

		if (isUpcoming) {
			const existing = nextBookingMap.get(slot.tableId);

			if (!existing || slot.slotHour < existing.slotHour) {
				nextBookingMap.set(slot.tableId, {
					bookingId: slot.booking.id,
					bookingCode: slot.booking.bookingCode,
					customerName: slot.booking.customerName,
					customerPhone: slot.booking.customerPhone,
					slotHour: slot.slotHour,
					slotEndHour: slot.slotEndHour,
				});
			}
		}
	}

	const storeBoards = stores.map((store) => {
		const tables = store.tables.map((table) => {
			const openTable = openTableMap.get(table.id) ?? null;
			const currentBooking = currentBookingMap.get(table.id) ?? null;
			const nextBooking = nextBookingMap.get(table.id) ?? null;

			let currentStatus: TodayTableBoardStatus = "FREE";

			if (openTable) {
				currentStatus = "OPEN_TABLE";
			} else if (currentBooking) {
				currentStatus = "BOOKED_NOW";
			} else if (nextBooking) {
				currentStatus = "UPCOMING_BOOKING";
			}

			return {
				...table,
				currentStatus,
				openTable,
				currentBooking,
				nextBooking,
			};
		});

		return {
			id: store.id,
			name: store.name,
			tables,
		};
	});

	const allTables = storeBoards.flatMap((store) => store.tables);

	const summary = {
		totalTables: allTables.length,
		openTableCount: allTables.filter(
			(table) => table.currentStatus === "OPEN_TABLE"
		).length,
		bookedNowCount: allTables.filter(
			(table) => table.currentStatus === "BOOKED_NOW"
		).length,
		upcomingCount: allTables.filter(
			(table) => table.currentStatus === "UPCOMING_BOOKING"
		).length,
		freeCount: allTables.filter((table) => table.currentStatus === "FREE")
			.length,
	};

	return {
		today,
		currentHour,
		summary,
		stores: storeBoards,
	};
}