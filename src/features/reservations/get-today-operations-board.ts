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
			// tableDisplay: string | null;
			displayLabel: string | null;
			capacity: number | null;
			currentStatus: TodayTableBoardStatus;
			openTable: {
				sessionId: string;
				customerName: string;
				customerPhone: string | null;
				openedAt: Date;
				estimatedEndAt: Date;
				paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
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

function pad(value: number) {
	return String(value).padStart(2, "0");
}

function buildSlotDate(dateText: string, hour: number) {
	return new Date(`${dateText}T${pad(hour)}:00:00+07:00`);
}

function getNowInJakartaDate() {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Jakarta",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	}).formatToParts(new Date());

	const map = Object.fromEntries(
		parts
			.filter((part) => part.type !== "literal")
			.map((part) => [part.type, part.value])
	) as Record<string, string>;

	return new Date(
		`${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}:${map.second}+07:00`
	);
}

export async function getTodayOperationsBoard(): Promise<TodayOperationsBoardData> {
	await expireOverdueBookings();

	const today = getTodayDateStringInJakarta();
	const currentHour = getCurrentHourInJakarta();
	const bookingDateValue = new Date(`${today}T00:00:00.000Z`);
	const nowInJakarta = getNowInJakartaDate();

	const [stores, bookingSlots, activeWalkInSessions] = await Promise.all([
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
						displayLabel: true,
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

		prisma.walkInSession.findMany({
			where: {
				bookingDate: bookingDateValue,
				status: "ACTIVE",
			},
			orderBy: {
				startedAt: "asc",
			},
			select: {
				id: true,
				tableId: true,
				customerName: true,
				customerPhone: true,
				startedAt: true,
				estimatedEndAt: true,
				paymentStatus: true,
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
			estimatedEndAt: Date;
			paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
		}
	>();

	for (const session of activeWalkInSessions) {
		const isCurrentlyActive =
			session.startedAt <= nowInJakarta && session.estimatedEndAt > nowInJakarta;

		if (!isCurrentlyActive) continue;
		if (openTableMap.has(session.tableId)) continue;

		openTableMap.set(session.tableId, {
			sessionId: session.id,
			customerName: session.customerName,
			customerPhone: session.customerPhone,
			openedAt: session.startedAt,
			estimatedEndAt: session.estimatedEndAt,
			paymentStatus: session.paymentStatus,
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

	for (const slot of bookingSlots) {
		const slotStart = buildSlotDate(today, slot.slotHour);
		const slotEnd = buildSlotDate(today, slot.slotEndHour);

		const isCurrent = slotStart <= nowInJakarta && slotEnd > nowInJakarta;
		const isUpcoming = slotStart > nowInJakarta;

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
					customerPhone: slot.booking.customerPhone ?? "-",
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
				tableDisplay: table.displayLabel ?? null,
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