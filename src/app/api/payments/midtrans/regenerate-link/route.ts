import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BOOKING_HOLD_MINUTES } from "@/lib/constants";
import { isMidtransConfigured } from "@/lib/midtrans";
import { generateMidtransOrderId } from "@/features/payments/generate-midtrans-order-id";
import { createMidtransSnapTransaction } from "@/features/payments/create-midtrans-snap-transaction";
import { updateBookingPaymentRequest } from "@/features/payments/update-booking-payment-request";

export async function POST(request: Request) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Kamu harus login dulu." },
				{ status: 401 }
			);
		}

		if (!isMidtransConfigured()) {
			return NextResponse.json(
				{ error: "Midtrans belum dikonfigurasi." },
				{ status: 400 }
			);
		}

		const body = await request.json().catch(() => ({}));
		const bookingCode =
			typeof body?.bookingCode === "string" ? body.bookingCode.trim() : "";

		if (!bookingCode) {
			return NextResponse.json(
				{ error: "bookingCode wajib diisi." },
				{ status: 400 }
			);
		}

		const booking = await prisma.booking.findUnique({
			where: { bookingCode },
			select: {
				id: true,
				bookingCode: true,
				userId: true,
				status: true,
				totalPrice: true,
				customerName: true,
				customerEmail: true,
				customerPhone: true,
				paymentGatewayProvider: true,
			},
		});

		if (!booking) {
			return NextResponse.json(
				{ error: "Booking tidak ditemukan." },
				{ status: 404 }
			);
		}

		const isAdmin = session.user.role === "ADMIN";
		const isOwner = booking.userId === session.user.id;

		if (!isAdmin && !isOwner) {
			return NextResponse.json(
				{ error: "Kamu tidak punya akses ke booking ini." },
				{ status: 403 }
			);
		}

		if (booking.paymentGatewayProvider !== "MIDTRANS") {
			return NextResponse.json(
				{ error: "Booking ini tidak memakai Midtrans." },
				{ status: 400 }
			);
		}

		if (booking.status !== "AWAITING_PAYMENT") {
			return NextResponse.json(
				{
					error:
						"Link pembayaran hanya bisa dibuat ulang untuk booking yang masih menunggu pembayaran.",
				},
				{ status: 400 }
			);
		}

		const orderId = generateMidtransOrderId(booking.bookingCode);

		const snapTransaction = await createMidtransSnapTransaction({
			orderId,
			grossAmount: booking.totalPrice,
			bookingCode: booking.bookingCode,
			customer: {
				firstName: booking.customerName,
				email: booking.customerEmail,
				phone: booking.customerPhone,
			},
		});

		const nextExpiresAt = new Date(
			Date.now() + BOOKING_HOLD_MINUTES * 60 * 1000
		);

		await prisma.$transaction(async (tx) => {
			await tx.booking.update({
				where: { id: booking.id },
				data: {
					expiresAt: nextExpiresAt,
					paymentGatewayStatus: "TOKEN_REGENERATED",
					paymentMethodCode: "MIDTRANS_SNAP",
				},
			});

			await tx.bookingStatusLog.create({
				data: {
					bookingId: booking.id,
					oldStatus: booking.status,
					newStatus: booking.status,
					changedByUserId: session.user.id,
					note: "Link pembayaran Midtrans dibuat ulang.",
				},
			});
		});

		await updateBookingPaymentRequest({
			bookingId: booking.id,
			paymentReferenceId: orderId,
			paymentMethodCode: "MIDTRANS_SNAP",
			gatewayStatus: "TOKEN_REGENERATED",
			gatewayToken: snapTransaction.token ?? null,
			checkoutUrl: snapTransaction.redirect_url ?? null,
			actionType: "REDIRECT_CUSTOMER",
			actionDescriptor: "SNAP_REDIRECT_REGENERATED",
			actionValue: snapTransaction.redirect_url ?? null,
			payload: snapTransaction,
		});

		return NextResponse.json({
			success: true,
			payment: {
				checkoutUrl: snapTransaction.redirect_url ?? null,
				gatewayToken: snapTransaction.token ?? null,
				gatewayStatus: "TOKEN_REGENERATED",
			},
			expiresAt: nextExpiresAt.toISOString(),
		});
	} catch (error) {
		console.error("Regenerate Midtrans payment link error:", error);

		return NextResponse.json(
			{ error: "Gagal membuat ulang link pembayaran Midtrans." },
			{ status: 500 }
		);
	}
}