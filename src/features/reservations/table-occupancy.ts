import type {
	BookingSource,
	BookingStatus,
	Prisma,
	WalkInPaymentStatus,
} from "@prisma/client";
import { ACTIVE_BOOKING_STATUSES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export type OccupancyBookingSlot = {
	id: string;
	bookingId: string;
	tableId: string;
	slotHour: number;
	slotEndHour: number;
	status: BookingStatus;
	booking: {
		id: string;
		bookingCode: string;
		customerName: string;
		customerPhone: string | null;
		source: BookingSource;
	};
};

export type OccupancyWalkInSession = {
	id: string;
	tableId: string;
	customerName: string;
	customerPhone: string | null;
	startedAt: Date;
	estimatedEndAt: Date;
	paymentStatus: WalkInPaymentStatus;
};

export function getBookingDateValue(bookingDate: string) {
	return new Date(`${bookingDate}T00:00:00.000Z`);
}

function pad(value: number) {
	return String(value).padStart(2, "0");
}

export function buildSlotDate(bookingDate: string, hour: number) {
	return new Date(`${bookingDate}T${pad(hour)}:00:00+07:00`);
}

export function isTimeRangeOverlap(
	startA: Date,
	endA: Date,
	startB: Date,
	endB: Date
) {
	return startA < endB && endA > startB;
}

export function getDateKeyInJakarta(value: Date) {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Jakarta",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(value);

	const map = Object.fromEntries(
		parts
			.filter((part) => part.type !== "literal")
			.map((part) => [part.type, part.value])
	) as Record<string, string>;

	return `${map.year}-${map.month}-${map.day}`;
}

export function getNowInJakarta() {
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

	return {
		dateKey: `${map.year}-${map.month}-${map.day}`,
		hour: Number(map.hour),
		minute: Number(map.minute),
	};
}

export async function getActiveOccupancyForStoreDate({
	storeId,
	bookingDate,
}: {
	storeId: string;
	bookingDate: string;
}) {
	const bookingDateValue = getBookingDateValue(bookingDate);

	const [bookingSlots, walkInSessions] = await Promise.all([
		prisma.bookingSlot.findMany({
			where: {
				storeId,
				bookingDate: bookingDateValue,
				status: {
					in: [...ACTIVE_BOOKING_STATUSES],
				},
				table: {
					isActive: true,
				},
			},
			orderBy: [{ tableId: "asc" }, { slotHour: "asc" }],
			select: {
				id: true,
				bookingId: true,
				tableId: true,
				slotHour: true,
				slotEndHour: true,
				status: true,
				booking: {
					select: {
						id: true,
						bookingCode: true,
						customerName: true,
						customerPhone: true,
						source: true,
					},
				},
			},
		}),

		prisma.walkInSession.findMany({
			where: {
				storeId,
				bookingDate: bookingDateValue,
				status: "ACTIVE",
				table: {
					isActive: true,
				},
			},
			orderBy: [{ tableId: "asc" }, { startedAt: "asc" }],
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

	return {
		bookingDateValue,
		bookingSlots,
		walkInSessions,
	};
}

export function buildBookingSlotsByTableHour(
	bookingSlots: OccupancyBookingSlot[]
) {
	const map = new Map<string, Map<number, OccupancyBookingSlot>>();

	for (const slot of bookingSlots) {
		if (!map.has(slot.tableId)) {
			map.set(slot.tableId, new Map<number, OccupancyBookingSlot>());
		}

		const tableMap = map.get(slot.tableId)!;

		for (let hour = slot.slotHour; hour < slot.slotEndHour; hour += 1) {
			tableMap.set(hour, slot);
		}
	}

	return map;
}

export function groupWalkInsByTableId(walkInSessions: OccupancyWalkInSession[]) {
	const map = new Map<string, OccupancyWalkInSession[]>();

	for (const session of walkInSessions) {
		const existing = map.get(session.tableId) ?? [];
		existing.push(session);
		map.set(session.tableId, existing);
	}

	return map;
}

export function findWalkInForHour({
	bookingDate,
	hour,
	walkIns,
}: {
	bookingDate: string;
	hour: number;
	walkIns: OccupancyWalkInSession[];
}) {
	const slotStart = buildSlotDate(bookingDate, hour);
	const slotEnd = buildSlotDate(bookingDate, hour + 1);

	return (
		walkIns.find((session) =>
			isTimeRangeOverlap(
				slotStart,
				slotEnd,
				session.startedAt,
				session.estimatedEndAt
			)
		) ?? null
	);
}

export async function findTableOccupancyConflicts({
	tableId,
	bookingDate,
	startHour,
	endHour,
	ignoreBookingId,
	ignoreWalkInSessionId,
}: {
	tableId: string;
	bookingDate: string;
	startHour: number;
	endHour: number;
	ignoreBookingId?: string;
	ignoreWalkInSessionId?: string;
}) {
	const bookingDateValue = getBookingDateValue(bookingDate);
	const requestedStart = buildSlotDate(bookingDate, startHour);
	const requestedEnd = buildSlotDate(bookingDate, endHour);

	const bookingSlotWhere: Prisma.BookingSlotWhereInput = {
		tableId,
		bookingDate: bookingDateValue,
		status: {
			in: [...ACTIVE_BOOKING_STATUSES],
		},
	};

	if (ignoreBookingId) {
		bookingSlotWhere.bookingId = {
			not: ignoreBookingId,
		};
	}

	const walkInWhere: Prisma.WalkInSessionWhereInput = {
		tableId,
		bookingDate: bookingDateValue,
		status: "ACTIVE",
	};

	if (ignoreWalkInSessionId) {
		walkInWhere.id = {
			not: ignoreWalkInSessionId,
		};
	}

	const [bookingSlots, walkInSessions] = await Promise.all([
		prisma.bookingSlot.findMany({
			where: bookingSlotWhere,
			select: {
				id: true,
				bookingId: true,
				slotHour: true,
				slotEndHour: true,
				status: true,
			},
		}),

		prisma.walkInSession.findMany({
			where: walkInWhere,
			select: {
				id: true,
				startedAt: true,
				estimatedEndAt: true,
			},
		}),
	]);

	const bookingConflicts = bookingSlots.filter((slot) => {
		const slotStart = buildSlotDate(bookingDate, slot.slotHour);
		const slotEnd = buildSlotDate(bookingDate, slot.slotEndHour);

		return isTimeRangeOverlap(requestedStart, requestedEnd, slotStart, slotEnd);
	});

	const walkInConflicts = walkInSessions.filter((session) =>
		isTimeRangeOverlap(
			requestedStart,
			requestedEnd,
			session.startedAt,
			session.estimatedEndAt
		)
	);

	return {
		bookingConflicts,
		walkInConflicts,
		hasBookingConflict: bookingConflicts.length > 0,
		hasWalkInConflict: walkInConflicts.length > 0,
		hasConflict: bookingConflicts.length > 0 || walkInConflicts.length > 0,
	};
}