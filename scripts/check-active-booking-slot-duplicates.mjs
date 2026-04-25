import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	const duplicates = await prisma.$queryRaw`
		SELECT
			"tableId",
			"bookingDate",
			"slotHour",
			COUNT(*)::int AS "count",
			ARRAY_AGG("bookingId") AS "bookingIds",
			ARRAY_AGG("status"::text) AS "statuses"
		FROM "BookingSlot"
		WHERE "status" IN (
			'AWAITING_PAYMENT'::"BookingStatus",
			'PENDING_VERIFICATION'::"BookingStatus",
			'CONFIRMED'::"BookingStatus"
		)
		GROUP BY "tableId", "bookingDate", "slotHour"
		HAVING COUNT(*) > 1
		ORDER BY "bookingDate", "tableId", "slotHour";
	`;

	if (duplicates.length === 0) {
		console.log("OK: Tidak ada duplicate active booking slot.");
		return;
	}

	console.error("Ditemukan duplicate active booking slot:");
	console.table(
		duplicates.map((item) => ({
			tableId: item.tableId,
			bookingDate:
				item.bookingDate instanceof Date
					? item.bookingDate.toISOString().slice(0, 10)
					: item.bookingDate,
			slotHour: item.slotHour,
			count: item.count,
			bookingIds: Array.isArray(item.bookingIds)
				? item.bookingIds.join(", ")
				: item.bookingIds,
			statuses: Array.isArray(item.statuses)
				? item.statuses.join(", ")
				: item.statuses,
		}))
	);

	process.exitCode = 1;
}

main()
	.catch((error) => {
		console.error("Gagal mengecek duplicate active booking slot:", error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});