import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
	params: Promise<{
		id: string;
	}>;
};

export async function PATCH(request: Request, context: RouteContext) {
	try {
		const session = await auth();

		if (!session?.user || session.user.role !== "ADMIN") {
			return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
		}

		const { id } = await context.params;
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
		const isActive = Boolean(body?.isActive);

		if (!Number.isFinite(tableNumber) || tableNumber <= 0) {
			return NextResponse.json(
				{ error: "Nomor meja tidak valid." },
				{ status: 400 }
			);
		}

		const existing = await prisma.table.findUnique({
			where: { id },
			select: {
				id: true,
				storeId: true,
			},
		});

		if (!existing) {
			return NextResponse.json(
				{ error: "Meja tidak ditemukan." },
				{ status: 404 }
			);
		}

		const duplicateTableNumber = await prisma.table.findFirst({
			where: {
				storeId: existing.storeId,
				tableNumber,
				id: {
					not: id,
				},
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

		await prisma.table.update({
			where: { id },
			data: {
				tableNumber,
				tableCode: tableCode || null,
				displayLabel: displayLabel || null,
				capacity,
				notes: notes || null,
				// sortOrder,
				isActive,
			},
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Update table error:", error);

		return NextResponse.json(
			{ error: "Gagal mengupdate meja." },
			{ status: 500 }
		);
	}
}