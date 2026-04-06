import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMidtransSignature } from "@/features/payments/verify-midtrans-signature";

type MidtransNotificationBody = {
	order_id: string;
	status_code: string;
	gross_amount: string;
	signature_key: string;
	transaction_status: string;
	fraud_status?: string;
	payment_type?: string;
	transaction_id?: string;
	settlement_time?: string;
	transaction_time?: string;
	status_message?: string;
};

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as MidtransNotificationBody;

		console.log("Midtrans webhook body:", body);
		

		const {
			order_id,
			status_code,
			gross_amount,
			signature_key,
			transaction_status,
			fraud_status,
			payment_type,
		} = body;

		
		if (order_id?.startsWith("payment_notif_test_")) {
			return NextResponse.json({
				received: true,
				action: "midtrans_test_notification_ok",
			});
		}

		if (!order_id || !status_code || !gross_amount || !signature_key || !transaction_status) {
			return NextResponse.json(
				{ error: "Invalid Midtrans notification payload." },
				{ status: 400 }
			);
		}

		const isValidSignature = verifyMidtransSignature({
			orderId: order_id,
			statusCode: status_code,
			grossAmount: gross_amount,
			signatureKey: signature_key,
		});

		if (!isValidSignature) {
			return NextResponse.json(
				{ error: "Invalid Midtrans signature." },
				{ status: 403 }
			);
		}

		const booking = await prisma.booking.findUnique({
			where: {
				paymentReferenceId: order_id,
			},
			select: {
				id: true,
				status: true,
				paymentReferenceId: true,
			},
		});

		if (!booking) {
			return NextResponse.json(
				{ error: "Booking not found for this Midtrans order_id." },
				{ status: 404 }
			);
		}

		// Simpan update payload dasar dulu
		await prisma.booking.update({
			where: {
				id: booking.id,
			},
			data: {
				paymentGatewayStatus: transaction_status,
				paymentMethodCode: payment_type?.toUpperCase() || undefined,
				paymentGatewayPayload: body as object,
			},
		});

		const isSuccess =
			transaction_status === "settlement" ||
			(transaction_status === "capture" && fraud_status === "accept");

		if (isSuccess) {
			if (booking.status !== "CONFIRMED") {
				await prisma.$transaction(async (tx) => {
					await tx.booking.update({
						where: {
							id: booking.id,
						},
						data: {
							status: "CONFIRMED",
							confirmedAt: new Date(),
							paymentSucceededAt: new Date(),
							paymentGatewayStatus: transaction_status,
							paymentMethodCode: payment_type?.toUpperCase() || undefined,
							paymentGatewayPayload: body as object,
						},
					});

					await tx.bookingSlot.updateMany({
						where: {
							bookingId: booking.id,
						},
						data: {
							status: "CONFIRMED",
						},
					});

					await tx.bookingStatusLog.create({
						data: {
							bookingId: booking.id,
							oldStatus: booking.status,
							newStatus: "CONFIRMED",
							note: `Auto-confirm via Midtrans webhook (${transaction_status}).`,
						},
					});
				});
			}

			return NextResponse.json({ received: true, action: "confirmed" });
		}

		if (transaction_status === "expire") {
			if (booking.status !== "CONFIRMED" && booking.status !== "EXPIRED") {
				await prisma.$transaction(async (tx) => {
					await tx.booking.update({
						where: {
							id: booking.id,
						},
						data: {
							status: "EXPIRED",
							paymentExpiredAt: new Date(),
							paymentGatewayStatus: transaction_status,
							paymentMethodCode: payment_type?.toUpperCase() || undefined,
							paymentGatewayPayload: body as object,
						},
					});

					await tx.bookingSlot.updateMany({
						where: {
							bookingId: booking.id,
						},
						data: {
							status: "EXPIRED",
						},
					});

					await tx.bookingStatusLog.create({
						data: {
							bookingId: booking.id,
							oldStatus: booking.status,
							newStatus: "EXPIRED",
							note: "Auto-expire via Midtrans webhook.",
						},
					});
				});
			}

			return NextResponse.json({ received: true, action: "expired" });
		}

		// pending / deny / cancel / failure / others:
		// jangan ubah status booking final dulu, biarkan masih bisa lanjut/ulang bayar
		return NextResponse.json({ received: true, action: "updated" });
	} catch (error) {
		console.error("Midtrans notification error:", error);

		return NextResponse.json(
			{ error: "Failed to handle Midtrans notification." },
			{ status: 500 }
		);
	}
}