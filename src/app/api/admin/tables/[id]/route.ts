import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "../../../../../lib/prisma";

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

		const tableNumber = Number(body?.tableNumber);
		const tableCode =
			typeof body?.tableCode === "string" && body.tableCode.trim().length > 0
				? body.tableCode.trim()
				: null;
		const displayLabel =
			typeof body?.displayLabel === "string" &&
			body.displayLabel.trim().length > 0
				? body.displayLabel.trim()
				: null;
		const capacity =
			body?.capacity == null || body.capacity === ""
				? null
				: Number(body.capacity);
		const note =
			typeof body?.note === "string" && body.note.trim().length > 0
				? body.note.trim()
				: null;
		const isActive = Boolean(body?.isActive);

		if (!Number.isInteger(tableNumber) || tableNumber <= 0) {
			return NextResponse.json(
				{ error: "Nomor meja wajib berupa angka valid." },
				{ status: 400 }
			);
		}

		if (capacity != null && (!Number.isInteger(capacity) || capacity <= 0)) {
			return NextResponse.json(
				{ error: "Kapasitas meja tidak valid." },
				{ status: 400 }
			);
		}

		const table = await prisma.table.findUnique({
			where: { id },
			select: {
				id: true,
				storeId: true,
			},
		});

		if (!table) {
			return NextResponse.json(
				{ error: "Meja tidak ditemukan." },
				{ status: 404 }
			);
		}

		const existingNumber = await prisma.table.findFirst({
			where: {
				storeId: table.storeId,
				tableNumber,
				id: {
					not: id,
				},
			},
			select: { id: true },
		});

		if (existingNumber) {
			return NextResponse.json(
				{ error: "Nomor meja sudah dipakai di store ini." },
				{ status: 409 }
			);
		}

		await prisma.table.update({
			where: { id },
			data: {
				tableNumber,
				tableCode,
				displayLabel,
				capacity,
				note,
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