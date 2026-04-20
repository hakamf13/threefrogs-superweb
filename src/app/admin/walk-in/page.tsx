import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import WalkInManager from "./walk-in-manager";
import { ACTIVE_BOOKING_STATUSES } from "@/lib/constants";

export const dynamic = "force-dynamic";

function formatDateKeyInJakarta(date: Date) {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Jakarta",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(date);

	const map = Object.fromEntries(
		parts
			.filter((part) => part.type !== "literal")
			.map((part) => [part.type, part.value])
	) as Record<string, string>;

	return `${map.year}-${map.month}-${map.day}`;
}

function pad(value: number) {
	return String(value).padStart(2, "0");
}

function buildSlotDateIso(dateText: string, hour: number) {
	return new Date(`${dateText}T${pad(hour)}:00:00+07:00`).toISOString();
}

export default async function AdminWalkInPage() {
	const session = await auth();

	if (!session?.user || session.user.role !== "ADMIN") {
		redirect("/login?callbackUrl=/admin/walk-in");
	}

	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);

	const stores = await prisma.store.findMany({
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
	});

	const activeSessions = await prisma.walkInSession.findMany({
		where: {
			status: "ACTIVE",
		},
		orderBy: {
			startedAt: "desc",
		},
		include: {
			store: {
				select: {
					id: true,
					name: true,
				},
			},
			table: {
				select: {
					id: true,
					tableNumber: true,
					displayLabel: true,
				},
			},
		},
	});

	const recentSessions = await prisma.walkInSession.findMany({
		where: {
			status: {
				in: ["CLOSED", "CANCELLED"],
			},
			createdAt: {
				gte: todayStart,
			},
		},
		orderBy: {
			updatedAt: "desc",
		},
		take: 20,
		include: {
			store: {
				select: {
					name: true,
				},
			},
			table: {
				select: {
					tableNumber: true,
					displayLabel: true,
				},
			},
		},
	});

	const activeTableIds = Array.from(new Set(activeSessions.map((item) => item.tableId)));
	const activeBookingDates = Array.from(
		new Set(activeSessions.map((item) => item.bookingDate.toISOString()))
	).map((value) => new Date(value));

	const relatedBookingSlots =
		activeTableIds.length === 0 || activeBookingDates.length === 0
			? []
			: await prisma.bookingSlot.findMany({
					where: {
						tableId: {
							in: activeTableIds,
						},
						bookingDate: {
							in: activeBookingDates,
						},
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
							},
						},
					},
				});

	const nextBookingMap = new Map<
		string,
		{
			bookingId: string;
			bookingCode: string;
			customerName: string;
			slotHour: number;
			slotEndHour: number;
			startsAt: string;
			endsAt: string;
		} | null
	>();

	for (const sessionItem of activeSessions) {
		const bookingDateKey = formatDateKeyInJakarta(sessionItem.bookingDate);

		const candidateSlots = relatedBookingSlots
			.filter(
				(slot) =>
					slot.tableId === sessionItem.tableId &&
					slot.bookingDate.toISOString() === sessionItem.bookingDate.toISOString()
			)
			.map((slot) => ({
				bookingId: slot.booking.id,
				bookingCode: slot.booking.bookingCode,
				customerName: slot.booking.customerName,
				slotHour: slot.slotHour,
				slotEndHour: slot.slotEndHour,
				startsAt: buildSlotDateIso(bookingDateKey, slot.slotHour),
				endsAt: buildSlotDateIso(bookingDateKey, slot.slotEndHour),
			}))
			.sort((a, b) => a.slotHour - b.slotHour);

		const sessionStartedAt = new Date(sessionItem.startedAt).getTime();

		const nextScheduled =
			candidateSlots.find(
				(slot) => new Date(slot.startsAt).getTime() >= sessionStartedAt
			) ?? null;

		nextBookingMap.set(sessionItem.id, nextScheduled);
	}

	return (
		<WalkInManager
			stores={stores.map((store) => ({
				id: store.id,
				name: store.name,
				tables: store.tables.map((table) => ({
					id: table.id,
					tableNumber: table.tableNumber,
					tableCode: table.tableCode,
					displayLabel: table.displayLabel,
					capacity: table.capacity,
				})),
			}))}
			activeSessions={activeSessions.map((sessionItem) => ({
				id: sessionItem.id,
				customerName: sessionItem.customerName,
				customerPhone: sessionItem.customerPhone,
				notes: sessionItem.notes,
				status: sessionItem.status,
				paymentStatus: sessionItem.paymentStatus,
				paymentNote: sessionItem.paymentNote,
				startedAt: sessionItem.startedAt.toISOString(),
				estimatedEndAt: sessionItem.estimatedEndAt.toISOString(),
				actualEndedAt: sessionItem.actualEndedAt?.toISOString() ?? null,
				durationMinutes: sessionItem.durationMinutes,
				billedMinutes: sessionItem.billedMinutes,
				totalPrice: sessionItem.totalPrice,
				store: sessionItem.store,
				table: sessionItem.table,
				nextScheduledBooking: nextBookingMap.get(sessionItem.id) ?? null,
			}))}
			recentSessions={recentSessions.map((sessionItem) => ({
				id: sessionItem.id,
				customerName: sessionItem.customerName,
				customerPhone: sessionItem.customerPhone,
				notes: sessionItem.notes,
				status: sessionItem.status,
				paymentStatus: sessionItem.paymentStatus,
				paymentNote: sessionItem.paymentNote,
				startedAt: sessionItem.startedAt.toISOString(),
				estimatedEndAt: sessionItem.estimatedEndAt.toISOString(),
				actualEndedAt: sessionItem.actualEndedAt?.toISOString() ?? null,
				durationMinutes: sessionItem.durationMinutes,
				billedMinutes: sessionItem.billedMinutes,
				totalPrice: sessionItem.totalPrice,
				store: sessionItem.store,
				table: sessionItem.table,
			}))}
		/>
	);
}