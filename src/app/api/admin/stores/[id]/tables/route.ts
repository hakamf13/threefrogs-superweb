import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
	params: Promise<{
		id: string;
	}>;
};

export async function POST(request: Request, context: RouteContext) {
	try {
		const session = await auth();

		if (!session?.user || session.user.role !== "ADMIN") {
			return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
		}

		const { id: storeId } = await context.params;
		const body = await request.json().catch(() => ({}));

		const tableNumber = Number(body?.tableNumber ?? 0);
		const tableCode =
			typeof body?.tableCode === "string" ? body.tableCode.trim() : "";
		const displayLabel =
			typeof body?.displayLabel === "string" ? body.displayLabel.trim() : "";
		const capacity =
			body?.capacity === null || body?.capacity === undefined
				? null
				: Number(body.capacity);
		const notes = typeof body?.notes === "string" ? body.notes.trim() : "";
		// const sortOrder =
		// 	body?.sortOrder === null || body?.sortOrder === undefined
		// 		? 0
		// 		: Number(body.sortOrder);
		const isActive =
			typeof body?.isActive === "boolean" ? body.isActive : true;

		if (!Number.isFinite(tableNumber) || tableNumber <= 0) {
			return NextResponse.json(
				{ error: "Nomor meja tidak valid." },
				{ status: 400 }
			);
		}

		const store = await prisma.store.findUnique({
			where: { id: storeId },
			select: { id: true },
		});

		if (!store) {
			return NextResponse.json(
				{ error: "Store tidak ditemukan." },
				{ status: 404 }
			);
		}

		const duplicateTableNumber = await prisma.table.findFirst({
			where: {
				storeId,
				tableNumber,
			},
			select: {
				id: true,
			},
		});

		if (duplicateTableNumber) {
			return NextResponse.json(
				{ error: "Nomor meja sudah dipakai di store ini." },
				{ status: 409 }
			);
		}

		const created = await prisma.table.create({
			data: {
				storeId,
				tableNumber,
				tableCode: tableCode || null,
				displayLabel: displayLabel || null,
				capacity,
				notes: notes || null,
				// sortOrder,
				isActive,...NextResponse,
			},
			select: {
				id: true,
			},
		});

		return NextResponse.json({
			success: true,
			tableId: created.id,
		});
	} catch (error) {
		console.error("Create table error:", error);

		return NextResponse.json(
			{ error: "Gagal membuat meja." },
			{ status: 500 }
		);
	}
}