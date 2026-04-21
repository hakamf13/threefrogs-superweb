type BookingStatus =
  | "AWAITING_PAYMENT"
  | "PENDING_VERIFICATION"
  | "CONFIRMED"
  | "CANCELLED"
  | "EXPIRED"
  | "COMPLETED";

type BookingStatusChipProps = {
  status: BookingStatus | string;
};

function formatFallbackLabel(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
}

function getStatusConfig(status: string) {
  switch (status) {
    case "AWAITING_PAYMENT":
      return {
        label: "Menunggu pembayaran",
        className: "border border-amber-200 bg-amber-50 text-amber-700",
      };
    case "PENDING_VERIFICATION":
      return {
        label: "Menunggu verifikasi",
        className: "border border-sky-200 bg-sky-50 text-sky-700",
      };
    case "CONFIRMED":
      return {
        label: "Terkonfirmasi",
        className: "border border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    case "CANCELLED":
      return {
        label: "Dibatalkan",
        className: "border border-rose-200 bg-rose-50 text-rose-700",
      };
    case "EXPIRED":
      return {
        label: "Kedaluwarsa",
        className: "border border-slate-200 bg-slate-100 text-slate-600",
      };
    case "COMPLETED":
      return {
        label: "Selesai",
        className: "border border-violet-200 bg-violet-50 text-violet-700",
      };
    default:
      return {
        label: formatFallbackLabel(status),
        className: "border border-slate-200 bg-slate-100 text-slate-700",
      };
  }
}

export default function BookingStatusChip({
  status,
}: BookingStatusChipProps) {
  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}