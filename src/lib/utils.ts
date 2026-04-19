export function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getTodayDateString() {
  return formatDateInput(new Date());
}

export function formatHourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00 - ${String(hour + 1).padStart(2, "0")}:00`;
}

export function formatDateDisplay(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
  }).format(date);
}

export function getBookingStatusLabel(status: string) {
  switch (status) {
    case "AWAITING_PAYMENT":
      return "Menunggu Pembayaran";
    case "PENDING_VERIFICATION":
      return "Menunggu Verifikasi";
    case "CONFIRMED":
      return "Terkonfirmasi";
    case "CANCELLED":
      return "Dibatalkan";
    case "EXPIRED":
      return "Kadaluarsa";
    default:
      return status;
  }
}

export function getBookingStatusColor(status: string) {
  switch (status) {
    case "AWAITING_PAYMENT":
      return "bg-orange-100 text-orange-700";
    case "PENDING_VERIFICATION":
      return "bg-yellow-100 text-yellow-700";
    case "CONFIRMED":
      return "bg-green-100 text-green-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    case "EXPIRED":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function getPaymentProofStatusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "Menunggu Dicek";
    case "APPROVED":
      return "Disetujui";
    case "REJECTED":
      return "Ditolak";
    case "SUPERSEDED":
      return "Digantikan";
    default:
      return status;
  }
}

export function getPaymentProofStatusColor(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-700";
    case "APPROVED":
      return "bg-green-100 text-green-700";
    case "REJECTED":
      return "bg-red-100 text-red-700";
    case "SUPERSEDED":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function formatDateTimeDisplay(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function getBookingStatusDescription(status: string) {
  switch (status) {
    case "AWAITING_PAYMENT":
      return "Booking kamu sudah dibuat. Silakan upload bukti pembayaran sebelum batas waktu habis.";
    case "PENDING_VERIFICATION":
      return "Bukti pembayaran sudah masuk dan sedang dicek admin.";
    case "CONFIRMED":
      return "Booking kamu sudah dikonfirmasi. Tinggal datang dan main sesuai jadwal.";
    case "CANCELLED":
      return "Booking ini sudah dibatalkan.";
    case "EXPIRED":
      return "Booking ini kadaluarsa karena melewati batas waktu pembayaran.";
    default:
      return status;
  }
}

export function getBookingStatusPanelClass(status: string) {
  switch (status) {
    case "AWAITING_PAYMENT":
      return "bg-orange-50 text-orange-800 border-orange-200";
    case "PENDING_VERIFICATION":
      return "bg-yellow-50 text-yellow-800 border-yellow-200";
    case "CONFIRMED":
      return "bg-green-50 text-green-800 border-green-200";
    case "CANCELLED":
      return "bg-red-50 text-red-800 border-red-200";
    case "EXPIRED":
      return "bg-slate-100 text-slate-700 border-slate-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

export function formatDurationMinutes(minutes?: number | null) {
  if (!minutes || minutes <= 0) return "-";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours} jam ${remainingMinutes} menit`;
  }

  if (hours > 0) {
    return `${hours} jam`;
  }

  return `${remainingMinutes} menit`;
}

export function formatBilledHours(hours?: number | null) {
  if (!hours || hours <= 0) return "-";

  if (hours === 0.5) {
    return "30 menit";
  }

  if (Number.isInteger(hours)) {
    return `${hours} jam`;
  }

  return `${hours} jam`;
}

export function getPaymentGatewayStatusLabel(status?: string | null) {
  if (!status) return "Belum Dibuat";

  switch (status.toLowerCase()) {
    case "token_created":
      return "Siap Dibayar";
    case "token_regenerated":
      return "Link Dibuat Ulang";
    case "token_failed":
      return "Gagal Membuat Link";
    case "pending":
      return "Menunggu Pembayaran";
    case "settlement":
      return "Pembayaran Berhasil";
    case "capture":
      return "Pembayaran Berhasil";
    case "expire":
      return "Kadaluarsa";
    case "cancel":
      return "Dibatalkan";
    case "deny":
      return "Ditolak";
    case "failure":
      return "Gagal";
    default:
      return status;
  }
}

export function getPaymentGatewayStatusColor(status?: string | null) {
  if (!status) {
    return "bg-slate-100 text-slate-700 border border-slate-200";
  }

  switch (status.toLowerCase()) {
    case "settlement":
    case "capture":
      return "bg-green-50 text-green-700 border border-green-200";
    case "pending":
    case "token_created":
    case "token_regenerated":
      return "bg-yellow-50 text-yellow-700 border border-yellow-200";
    case "expire":
    case "cancel":
    case "deny":
    case "failure":
    case "token_failed":
      return "bg-red-50 text-red-700 border border-red-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

export function getPaymentGatewayStatusDescription(status?: string | null) {
  if (!status) {
    return "Status pembayaran dari gateway belum tersedia.";
  }

  switch (status.toLowerCase()) {
    case "token_created":
      return "Link pembayaran berhasil dibuat dan siap digunakan.";
    case "token_regenerated":
      return "Link pembayaran berhasil dibuat ulang dan siap digunakan.";
    case "token_failed":
      return "Sistem gagal membuat link pembayaran otomatis. Coba buat ulang link pembayaran.";
    case "pending":
      return "Transaksi sudah dibuat, tetapi pembayaran belum selesai atau belum settle di Midtrans.";
    case "settlement":
      return "Pembayaran sudah diterima penuh oleh Midtrans dan booking seharusnya sudah terkonfirmasi otomatis.";
    case "capture":
      return "Pembayaran sudah diterima gateway. Booking akan dikonfirmasi sesuai hasil verifikasi Midtrans.";
    case "expire":
      return "Batas waktu pembayaran habis sebelum transaksi selesai.";
    case "cancel":
      return "Transaksi dibatalkan dari sisi gateway.";
    case "deny":
      return "Transaksi ditolak oleh gateway pembayaran.";
    case "failure":
      return "Terjadi kegagalan saat proses pembayaran.";
    default:
      return "Status pembayaran dari gateway belum tersedia.";
  }
}

export function getPaymentProviderLabel(provider?: string | null) {
  if (provider === "MIDTRANS") return "Midtrans";
  return "Manual";
}

export function isManualPaymentFallbackBooking(booking: {
  paymentGatewayProvider?: string | null;
}) {
  return !booking.paymentGatewayProvider;
}

export function isBookingNeedingAdminPaymentAction(booking: {
  paymentGatewayProvider?: string | null;
  status: string;
}) {
  return (
    !booking.paymentGatewayProvider &&
    (booking.status === "AWAITING_PAYMENT" ||
      booking.status === "PENDING_VERIFICATION")
  );
}

export function getAdminPaymentActionLabel(booking: {
  paymentGatewayProvider?: string | null;
  status: string;
  paymentGatewayStatus?: string | null;
}) {
  if (booking.paymentGatewayProvider === "MIDTRANS") {
    if (booking.status === "CONFIRMED") return "Auto-confirmed";
    if (booking.status === "AWAITING_PAYMENT") return "Menunggu customer bayar";
    if (booking.status === "EXPIRED") return "Gateway expired";
    if (booking.status === "CANCELLED") return "Dibatalkan";
    return "Gateway";
  }

  if (booking.status === "PENDING_VERIFICATION") {
    return "Perlu verifikasi admin";
  }

  if (booking.status === "AWAITING_PAYMENT") {
    return "Menunggu bukti bayar";
  }

  if (booking.status === "CONFIRMED") {
    return "Sudah dikonfirmasi";
  }

  if (booking.status === "EXPIRED") {
    return "Kadaluarsa";
  }

  if (booking.status === "CANCELLED") {
    return "Dibatalkan";
  }

  return booking.status;
}