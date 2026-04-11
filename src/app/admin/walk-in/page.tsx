import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import WalkInManager from "./walk-in-manager";

export const dynamic = "force-dynamic";

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
			activeSessions={activeSessions.map((session) => ({
				id: session.id,
				customerName: session.customerName,
				customerPhone: session.customerPhone,
				notes: session.notes,
				status: session.status,
				paymentStatus: session.paymentStatus,
				paymentNote: session.paymentNote,
				startedAt: session.startedAt.toISOString(),
				estimatedEndAt: session.estimatedEndAt.toISOString(),
				actualEndedAt: session.actualEndedAt?.toISOString() ?? null,
				durationMinutes: session.durationMinutes,
				billedMinutes: session.billedMinutes,
				totalPrice: session.totalPrice,
				store: session.store,
				table: session.table,
			}))}
			recentSessions={recentSessions.map((session) => ({
				id: session.id,
				customerName: session.customerName,
				customerPhone: session.customerPhone,
				notes: session.notes,
				status: session.status,
				paymentStatus: session.paymentStatus,
				paymentNote: session.paymentNote,
				startedAt: session.startedAt.toISOString(),
				estimatedEndAt: session.estimatedEndAt.toISOString(),
				actualEndedAt: session.actualEndedAt?.toISOString() ?? null,
				durationMinutes: session.durationMinutes,
				billedMinutes: session.billedMinutes,
				totalPrice: session.totalPrice,
				store: session.store,
				table: session.table,
			}))}
		/>
	);
}