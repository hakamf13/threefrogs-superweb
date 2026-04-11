import { formatDateDisplay, formatHourLabel, formatRupiah } from "@/lib/utils";
import { sendEmail } from "./email";

function getAppBaseUrl() {
	return process.env.APP_BASE_URL?.replace(/\/$/, "") || "";
}

function getAdminEmail() {
	return process.env.ADMIN_NOTIFICATION_EMAIL?.trim() || "";
}

function buildAdminBookingUrl(bookingId: string) {
	const baseUrl = getAppBaseUrl();
	return baseUrl ? `${baseUrl}/admin/bookings/${bookingId}` : "";
}

function buildCustomerBookingUrl(bookingCode: string) {
	const baseUrl = getAppBaseUrl();
	return baseUrl ? `${baseUrl}/booking/${bookingCode}` : "";
}

type BookingCreatedNotificationArgs = {
	bookingId: string;
	bookingCode: string;
	customerName: string;
	customerPhone: string | null;
	customerEmail?: string | null;
	storeName: string;
	bookingDate: Date;
	startHour: number;
	endHour: number;
	totalPrice: number;
};

export async function sendAdminBookingCreatedNotification(
	args: BookingCreatedNotificationArgs
) {
	const adminEmail = getAdminEmail();
	if (!adminEmail) {
		console.info("[email] skipped admin booking created notification");
		return;
	}

	const adminUrl = buildAdminBookingUrl(args.bookingId);

	await sendEmail({
		to: adminEmail,
		subject: `[Threefrogs] Booking baru ${args.bookingCode}`,
		idempotencyKey: `admin-booking-created-${args.bookingId}`,
		html: `
			<div style="font-family:Arial,sans-serif;line-height:1.6">
				<h2>Booking baru masuk</h2>
				<p><strong>Kode:</strong> ${args.bookingCode}</p>
				<p><strong>Customer:</strong> ${args.customerName}</p>
				<p><strong>No. HP:</strong> ${args.customerPhone}</p>
				<p><strong>Store:</strong> ${args.storeName}</p>
				<p><strong>Tanggal:</strong> ${formatDateDisplay(args.bookingDate)}</p>
				<p><strong>Jam:</strong> ${formatHourLabel(args.startHour)} sampai ${String(
			args.endHour
		).padStart(2, "0")}:00</p>
				<p><strong>Total:</strong> ${formatRupiah(args.totalPrice)}</p>
				${
					adminUrl
						? `<p><a href="${adminUrl}">Buka detail booking di admin</a></p>`
						: ""
				}
			</div>
		`,
	});
}

export async function sendCustomerBookingCreatedNotification(
	args: BookingCreatedNotificationArgs
) {
	if (!args.customerEmail?.trim()) return;

	const bookingUrl = buildCustomerBookingUrl(args.bookingCode);

	await sendEmail({
		to: args.customerEmail,
		subject: `[Threefrogs] Booking dibuat ${args.bookingCode}`,
		idempotencyKey: `customer-booking-created-${args.bookingId}`,
		html: `
			<div style="font-family:Arial,sans-serif;line-height:1.6">
				<h2>Booking kamu berhasil dibuat</h2>
				<p>Halo ${args.customerName}, booking kamu sudah masuk ke sistem.</p>
				<p><strong>Kode:</strong> ${args.bookingCode}</p>
				<p><strong>Store:</strong> ${args.storeName}</p>
				<p><strong>Tanggal:</strong> ${formatDateDisplay(args.bookingDate)}</p>
				<p><strong>Jam:</strong> ${formatHourLabel(args.startHour)} sampai ${String(
			args.endHour
		).padStart(2, "0")}:00</p>
				<p><strong>Total:</strong> ${formatRupiah(args.totalPrice)}</p>
				${
					bookingUrl
						? `<p><a href="${bookingUrl}">Lihat detail booking</a></p>`
						: ""
				}
			</div>
		`,
	});
}

type PaymentProofUploadedArgs = {
	bookingId: string;
	bookingCode: string;
	customerName: string;
};

export async function sendAdminPaymentProofUploadedNotification(
	args: PaymentProofUploadedArgs
) {
	const adminEmail = getAdminEmail();
	if (!adminEmail) return;

	const adminUrl = buildAdminBookingUrl(args.bookingId);

	await sendEmail({
		to: adminEmail,
		subject: `[Threefrogs] Bukti bayar baru ${args.bookingCode}`,
		idempotencyKey: `admin-proof-uploaded-${args.bookingCode}`,
		html: `
			<div style="font-family:Arial,sans-serif;line-height:1.6">
				<h2>Bukti pembayaran baru diupload</h2>
				<p><strong>Kode:</strong> ${args.bookingCode}</p>
				<p><strong>Customer:</strong> ${args.customerName}</p>
				${
					adminUrl
						? `<p><a href="${adminUrl}">Review bukti pembayaran di admin</a></p>`
						: ""
				}
			</div>
		`,
	});
}

type BookingStatusChangedArgs = {
	bookingId: string;
	bookingCode: string;
	customerName: string;
	customerEmail?: string | null;
	statusLabel: string;
	note?: string | null;
};

export async function sendCustomerBookingStatusChangedNotification(
	args: BookingStatusChangedArgs
) {
	if (!args.customerEmail?.trim()) return;

	const bookingUrl = buildCustomerBookingUrl(args.bookingCode);

	await sendEmail({
		to: args.customerEmail,
		subject: `[Threefrogs] Status booking ${args.bookingCode}: ${args.statusLabel}`,
		idempotencyKey: `customer-booking-status-${args.bookingId}-${args.statusLabel}`,
		html: `
			<div style="font-family:Arial,sans-serif;line-height:1.6">
				<h2>Status booking diperbarui</h2>
				<p>Halo ${args.customerName}, status booking kamu sekarang:</p>
				<p><strong>${args.statusLabel}</strong></p>
				<p><strong>Kode booking:</strong> ${args.bookingCode}</p>
				${args.note ? `<p><strong>Catatan:</strong> ${args.note}</p>` : ""}
				${
					bookingUrl
						? `<p><a href="${bookingUrl}">Lihat detail booking</a></p>`
						: ""
				}
			</div>
		`,
	});
}