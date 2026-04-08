import { Resend } from "resend";

type BasePayload = {
	bookingCode: string;
	customerName: string;
	customerPhone?: string | null;
	customerEmail?: string | null;
	storeName: string;
	tableLabel: string;
	bookingDate: Date | string;
	slotHours: number[];
	totalPrice: number;
};

type BookingCreatedPayload = BasePayload & {
	paymentMode: "MANUAL" | "MIDTRANS";
};

type PaymentProofUploadedPayload = BasePayload & {
	proofUrl: string;
};

type BookingCancelledPayload = BasePayload & {
	cancelledBy: "ADMIN" | "USER" | "SYSTEM";
	reason?: string | null;
};

function getEnv(name: string) {
	return process.env[name]?.trim() || "";
}

function getAdminEmails() {
	return getEnv("ADMIN_NOTIFICATION_EMAILS")
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
}

function getBaseUrl() {
	return getEnv("APP_BASE_URL").replace(/\/$/, "") || "http://localhost:3000";
}

function getEmailFrom() {
	return getEnv("EMAIL_FROM");
}

function isEmailEnabled() {
	return Boolean(getEnv("RESEND_API_KEY") && getEmailFrom() && getAdminEmails().length);
}

const resend = getEnv("RESEND_API_KEY")
	? new Resend(getEnv("RESEND_API_KEY"))
	: null;

function formatDate(date: Date | string) {
	return new Intl.DateTimeFormat("id-ID", {
		dateStyle: "full",
		timeZone: "Asia/Jakarta",
	}).format(new Date(date));
}

function formatSlots(slotHours: number[]) {
	return slotHours
		.map((hour) => `${String(hour).padStart(2, "0")}.00`)
		.join(", ");
}

function formatRupiah(amount: number) {
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	}).format(amount);
}

function escapeHtml(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

function getBookingUrl(bookingCode: string) {
	return `${getBaseUrl()}/booking/${bookingCode}`;
}

async function sendAdminEmail(subject: string, html: string, text: string) {
	if (!isEmailEnabled() || !resend) {
		console.info("[admin-notifications] Email skipped: env belum lengkap.");
		return;
	}

	await resend.emails.send({
		from: getEmailFrom(),
		to: getAdminEmails(),
		subject,
		html,
		text,
	});
}

function buildBaseHtml(payload: BasePayload) {
	const bookingUrl = getBookingUrl(payload.bookingCode);

	return `
		<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
			<p><strong>Kode Booking:</strong> ${escapeHtml(payload.bookingCode)}</p>
			<p><strong>Customer:</strong> ${escapeHtml(payload.customerName)}</p>
			<p><strong>Phone:</strong> ${escapeHtml(payload.customerPhone || "-")}</p>
			<p><strong>Email:</strong> ${escapeHtml(payload.customerEmail || "-")}</p>
			<p><strong>Store:</strong> ${escapeHtml(payload.storeName)}</p>
			<p><strong>Meja:</strong> ${escapeHtml(payload.tableLabel)}</p>
			<p><strong>Tanggal:</strong> ${escapeHtml(formatDate(payload.bookingDate))}</p>
			<p><strong>Slot:</strong> ${escapeHtml(formatSlots(payload.slotHours))}</p>
			<p><strong>Total:</strong> ${escapeHtml(formatRupiah(payload.totalPrice))}</p>
			<p><a href="${bookingUrl}">Lihat detail booking</a></p>
		</div>
	`;
}

function buildBaseText(payload: BasePayload) {
	return [
		`Kode Booking: ${payload.bookingCode}`,
		`Customer: ${payload.customerName}`,
		`Phone: ${payload.customerPhone || "-"}`,
		`Email: ${payload.customerEmail || "-"}`,
		`Store: ${payload.storeName}`,
		`Meja: ${payload.tableLabel}`,
		`Tanggal: ${formatDate(payload.bookingDate)}`,
		`Slot: ${formatSlots(payload.slotHours)}`,
		`Total: ${formatRupiah(payload.totalPrice)}`,
		`Detail: ${getBookingUrl(payload.bookingCode)}`,
	].join("\n");
}

export async function notifyAdminsBookingCreated(payload: BookingCreatedPayload) {
	const subject = `[Threefrogs] Booking Baru ${payload.bookingCode}`;
	const html = `
		<h2 style="font-family: Arial, sans-serif;">Booking Baru Masuk</h2>
		<p style="font-family: Arial, sans-serif;">
			Payment mode: <strong>${escapeHtml(payload.paymentMode)}</strong>
		</p>
		${buildBaseHtml(payload)}
	`;
	const text = [
		"Booking Baru Masuk",
		`Payment mode: ${payload.paymentMode}`,
		"",
		buildBaseText(payload),
	].join("\n");

	await sendAdminEmail(subject, html, text);
}

export async function notifyAdminsPaymentProofUploaded(
	payload: PaymentProofUploadedPayload
) {
	const subject = `[Threefrogs] Bukti Bayar Diupload ${payload.bookingCode}`;
	const html = `
		<h2 style="font-family: Arial, sans-serif;">Bukti Bayar Baru</h2>
		${buildBaseHtml(payload)}
		<p style="font-family: Arial, sans-serif;">
			<a href="${payload.proofUrl}">Lihat bukti bayar</a>
		</p>
	`;
	const text = [
		"Bukti Bayar Baru",
		"",
		buildBaseText(payload),
		`Bukti Bayar: ${payload.proofUrl}`,
	].join("\n");

	await sendAdminEmail(subject, html, text);
}

export async function notifyAdminsBookingCancelled(
	payload: BookingCancelledPayload
) {
	const subject = `[Threefrogs] Booking Dibatalkan ${payload.bookingCode}`;
	const html = `
		<h2 style="font-family: Arial, sans-serif;">Booking Dibatalkan</h2>
		<p style="font-family: Arial, sans-serif;">
			Dibatalkan oleh: <strong>${escapeHtml(payload.cancelledBy)}</strong>
		</p>
		${
			payload.reason
				? `<p style="font-family: Arial, sans-serif;"><strong>Alasan:</strong> ${escapeHtml(payload.reason)}</p>`
				: ""
		}
		${buildBaseHtml(payload)}
	`;
	const text = [
		"Booking Dibatalkan",
		`Dibatalkan oleh: ${payload.cancelledBy}`,
		payload.reason ? `Alasan: ${payload.reason}` : "",
		"",
		buildBaseText(payload),
	]
		.filter(Boolean)
		.join("\n");

	await sendAdminEmail(subject, html, text);
}