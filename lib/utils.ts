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