import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
	return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  return NextResponse.json(
	{
	  error:
		"Fitur Open Table sudah dinonaktifkan. Gunakan Walk-in Session di /admin/walk-in.",
	},
	{ status: 410 }
  );
}


/*
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "../../../../lib/prisma";
import { ACTIVE_BOOKING_STATUSES, PRICE_PER_HOUR } from "../../../../lib/constants";
import {
	getCurrentHourInJakarta,
	getTodayDateStringInJakarta,
} from "@/lib/booking-window";
import { createOpenTableSessionSchema } from "../../../../lib/validations";
import { OPEN_HOUR, CLOSE_HOUR } from "@/lib/constants";

export async function POST(request: Request) {
	try {
		const session = await auth();

		if (!session?.user || session.user.role !== "ADMIN") {
			return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
		}

		const body = await request.json();
		const parsed = createOpenTableSessionSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{
					error:
						parsed.error.issues[0]?.message ?? "Data open table tidak valid.",
				},
				{ status: 400 }
			);
		}

		const { storeId, tableId, customerName, customerPhone, notes } = parsed.data;

		const store = await prisma.store.findFirst({
			where: {
				id: storeId,
				isActive: true,
				category: "MAHJONG",
			},
			select: {
				id: true,
			},
		});

		if (!store) {
			return NextResponse.json(
				{ error: "Store tidak ditemukan." },
				{ status: 404 }
			);
		}

		const table = await prisma.table.findFirst({
			where: {
				id: tableId,
				storeId,
				isActive: true,
			},
			select: {
				id: true,
				tableNumber: true,
			},
		});

		if (!table) {
			return NextResponse.json(
				{ error: "Meja tidak ditemukan." },
				{ status: 404 }
			);
		}

		const existingOpenSession = await prisma.openTableSession.findFirst({
			where: {
				tableId,
				status: "OPEN",
			},
			select: {
				id: true,
			},
		});

		if (existingOpenSession) {
			return NextResponse.json(
				{ error: "Meja ini sedang dipakai Open Table." },
				{ status: 409 }
			);
		}

		const currentDate = getTodayDateStringInJakarta();
		const currentHour = getCurrentHourInJakarta();
		const bookingDateValue = new Date(`${currentDate}T00:00:00.000Z`);
		
		if (currentHour < OPEN_HOUR || currentHour >= CLOSE_HOUR) {
		return NextResponse.json(
			{ error: "Open Table hanya bisa dibuka saat jam operasional store." },
			{ status: 400 }
		);
		}

		const conflictingBookingToday = await prisma.bookingSlot.findFirst({
			where: {
				tableId,
				bookingDate: bookingDateValue,
				slotEndHour: {
				gt: currentHour,
				},
				status: {
				in: [...ACTIVE_BOOKING_STATUSES],
				},
			},
			select: {
				id: true,
			},
			});

			if (conflictingBookingToday) {
			return NextResponse.json(
				{
				error:
					"Meja ini masih punya booking aktif atau booking berikutnya di sisa hari ini.",
				},
				{ status: 409 }
			);
			}

		const openSession = await prisma.openTableSession.create({
			data: {
				storeId,
				tableId,
				customerName,
				customerPhone: customerPhone || null,
				notes: notes || null,
				status: "OPEN",
				openedAt: new Date(),
				pricePerHour: PRICE_PER_HOUR,
			},
		});

		return NextResponse.json({
			success: true,
			sessionId: openSession.id,
		});
	} catch (error) {
		console.error("Open table error:", error);

		return NextResponse.json(
			{ error: "Gagal membuka Open Table." },
			{ status: 500 }
		);
	}
}
*/