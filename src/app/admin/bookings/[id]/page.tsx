import { notFound } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import AdminBookingActions from "./admin-booking-actions";
import {
  formatDateDisplay,
  formatHourLabel,
  formatRupiah,
  getAdminPaymentActionLabel,
  getBookingStatusColor,
  getBookingStatusLabel,
  getPaymentGatewayStatusLabel,
  getPaymentProofStatusColor,
  getPaymentProofStatusLabel,
  getPaymentProviderLabel,
} from "../../../../lib/utils";
import { expireOverdueBookings } from "@/features/reservations/expire-overdue-bookings";
import BookingStatusChip from "@/components/bookings/bookings-status-chip";

export const dynamic = "force-dynamic";

type AdminBookingDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminBookingDetailPage({
  params,
}: AdminBookingDetailPageProps) {
  const { id } = await params;

  await expireOverdueBookings();

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      store: true,
      table: true,
      slots: {
        orderBy: {
          slotHour: "asc",
        },
      },
      paymentProofs: {
        orderBy: {
          uploadedAt: "desc",
        },
      },
      statusLogs: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!booking) {
    notFound();
  }

  const isMidtransBooking = booking.paymentGatewayProvider === "MIDTRANS";

  return (
    <main className="min-h-screen bg-[#F8F4FF] px-6 py-16 text-slate-800">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm text-slate-500">Kode Booking</p>
              <h1 className="text-3xl font-black text-[#5D3FD3]">
                {booking.bookingCode}
              </h1>
            </div>

            <BookingStatusChip status={booking.status} />

          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">Nama Pemesan</p>
              <p className="font-semibold">{booking.customerName}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">No. HP</p>
              <p className="font-semibold">{booking.customerPhone}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Store</p>
              <p className="font-semibold">{booking.store.name}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Meja</p>
              <p className="font-semibold">Meja {booking.table.tableNumber}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Tanggal</p>
              <p className="font-semibold">
                {formatDateDisplay(booking.bookingDate)}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Total</p>
              <p className="font-semibold">{formatRupiah(booking.totalPrice)}</p>
            </div>
          </div>

          <div className="mt-8">
            <p className="mb-3 text-sm text-slate-500">Slot Booking</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {booking.slots.map((slot) => (
                <div
                  key={slot.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <p className="font-semibold text-[#5D3FD3]">
                    {formatHourLabel(slot.slotHour)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-black uppercase tracking-widest text-[#C77A00]">
            Payment Source
          </p>
          <h2 className="mt-2 text-2xl font-black text-[#5D3FD3]">
            {getPaymentProviderLabel(booking.paymentGatewayProvider)}
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#EDE7FF] px-3 py-1 text-xs font-semibold text-[#5D3FD3]">
              {getAdminPaymentActionLabel(booking)}
            </span>

            {isMidtransBooking ? (
              <span className="rounded-full bg-[#FFF4DB] px-3 py-1 text-xs font-semibold text-[#C77A00]">
                {getPaymentGatewayStatusLabel(booking.paymentGatewayStatus)}
              </span>
            ) : null}
          </div>

          {isMidtransBooking ? (
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p>Provider: Midtrans</p>
              <p>Reference: {booking.paymentReferenceId || "-"}</p>
              <p>
                Gateway status:{" "}
                {getPaymentGatewayStatusLabel(booking.paymentGatewayStatus)}
              </p>
              {booking.paymentSucceededAt ? (
                <p>Pembayaran berhasil tercatat otomatis oleh sistem.</p>
              ) : null}
              {booking.paymentCheckoutUrl ? (
                <a
                  href={booking.paymentCheckoutUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-2xl border border-[#5D3FD3] px-4 py-2 font-semibold text-[#5D3FD3]"
                >
                  Buka Payment Page
                </a>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p>Booking ini memakai pembayaran manual fallback.</p>
              <p>Admin masih bisa review bukti pembayaran jika diperlukan.</p>
            </div>
          )}
        </div>

        <AdminBookingActions
          bookingId={booking.id}
          status={booking.status}
          paymentGatewayProvider={booking.paymentGatewayProvider}
        />

        {booking.paymentProofs.length > 0 ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-[#5D3FD3]">
              Riwayat Bukti Pembayaran
            </h2>

            <div className="space-y-3">
              {booking.paymentProofs.map((proof, index) => (
                <div
                  key={proof.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">
                        {index === 0
                          ? "Bukti Terbaru"
                          : proof.fileName || "Bukti Pembayaran"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {new Intl.DateTimeFormat("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(proof.uploadedAt)}
                      </p>
                      {proof.rejectionReason ? (
                        <p className="mt-1 text-sm text-slate-600">
                          Catatan: {proof.rejectionReason}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${getPaymentProofStatusColor(
                          proof.verificationStatus
                        )}`}
                      >
                        {getPaymentProofStatusLabel(
                          proof.verificationStatus
                        )}
                      </span>

                      <a
                        href={proof.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl border border-[#5D3FD3] px-4 py-2 font-semibold text-[#5D3FD3]"
                      >
                        Lihat
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-[#5D3FD3]">
            Riwayat Status
          </h2>

          <div className="space-y-4">
            {booking.statusLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <p className="font-semibold text-slate-800">
                  {log.oldStatus
                    ? `${log.oldStatus} → ${log.newStatus}`
                    : log.newStatus}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {log.note ?? "-"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}