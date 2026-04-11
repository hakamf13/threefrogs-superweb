import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminOpenTablesPage() {
  redirect("/admin/walk-in");
}

/*
import { prisma } from "../../../lib/prisma";
import OpenTableManager from "./open-table-manager";

export const dynamic = "force-dynamic";

export default async function AdminOpenTablesPage() {
	const [stores, activeSessions, recentSessions] = await Promise.all([
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
		prisma.openTableSession.findMany({
			where: {
				status: "OPEN",
			},
			orderBy: {
				openedAt: "desc",
			},
			include: {
				store: true,
				table: true,
			},
		}),
		prisma.openTableSession.findMany({
			where: {
				status: "CLOSED",
			},
			orderBy: {
				closedAt: "desc",
			},
			take: 20,
			include: {
				store: true,
				table: true,
			},
		}),
	]);

	return (
		<OpenTableManager
			stores={stores}
			activeSessions={activeSessions}
			recentSessions={recentSessions}
		/>
	);
}
	*/