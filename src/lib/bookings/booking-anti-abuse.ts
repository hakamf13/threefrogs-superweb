import { prisma } from "@/lib/prisma";

const ACTIVE_STATUSES = [
	"AWAITING_PAYMENT",
	"PENDING_VERIFICATION",
	"CONFIRMED",
] as const;

type AssertBookingAntiAbuseArgs = {
	customerPhone: string;
	bookingDate: Date;
};

export async function assertBookingAntiAbuse({
	customerPhone,
	bookingDate,
}: AssertBookingAntiAbuseArgs) {
	const now = new Date();
	const ninetySecondsAgo = new Date(now.getTime() - 90 * 1000);

	const recentAttempts = await prisma.booking.count({
		where: {
			customerPhone,
			createdAt: {
				gte: ninetySecondsAgo,
			},
		},
	});

	if (recentAttempts >= 2) {
		throw new Error(
			"Terlalu banyak percobaan booking dalam waktu singkat. Coba lagi sebentar."
		);
	}

	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);

	const activeBookings = await prisma.booking.count({
		where: {
			customerPhone,
			status: {
				in: [...ACTIVE_STATUSES],
			},
			bookingDate: {
				gte: todayStart,
			},
		},
	});

	if (activeBookings >= 3) {
		throw new Error(
			"Nomor HP ini masih memiliki terlalu banyak booking aktif. Selesaikan atau batalkan dulu booking sebelumnya."
		);
	}

	const bookingDayStart = new Date(bookingDate);
	bookingDayStart.setHours(0, 0, 0, 0);

	const bookingDayEnd = new Date(bookingDate);
	bookingDayEnd.setHours(23, 59, 59, 999);

	const sameDayBookings = await prisma.booking.count({
		where: {
			customerPhone,
			bookingDate: {
				gte: bookingDayStart,
				lte: bookingDayEnd,
			},
			status: {
				in: [...ACTIVE_STATUSES],
			},
		},
	});

	if (sameDayBookings >= 2) {
		throw new Error(
			"Nomor HP ini sudah punya terlalu banyak booking aktif di tanggal yang sama."
		);
	}
}