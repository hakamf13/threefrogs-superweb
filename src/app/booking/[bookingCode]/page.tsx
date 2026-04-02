import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/layout/site-header";
import { prisma } from "../../../../lib/prisma";
import { expireOverdueBookings } from "@/features/reservations/expire-overdue-bookings";
import PaymentProofUploader from "@/components/payments/payment-proof-uploader";
import {
  formatDateDisplay,
  formatHourLabel,
  formatRupiah,
  getBookingStatusLabel,
  getPaymentProofStatusColor,
  getPaymentProofStatusLabel,
} from "../../../../lib/utils";

export const dynamic = "force-dynamic";

type BookingDetailPageProps = {
  params: Promise<{
    bookingCode: string;
  }>;
};

export default async function BookingDetailPage({
  params,
}: BookingDetailPageProps) {
  await expireOverdueBookings();

  const { bookingCode } = await params;

  const booking = await prisma.booking.findUnique({
    where: {
      bookingCode,
    },
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
    },
  });

  if (!booking) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#F8F4FF] text-slate-800">
      <SiteHeader />

      <main className="px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
          <div className="mb-6">
            <p className="text-sm font-semibold text-slate-500">Kode Booking</p>
            <h1 className="text-3xl font-black text-[#5D3FD3]">
              {booking.bookingCode}
            </h1>
          </div>

          <div className="mb-8 rounded-2xl bg-yellow-50 p-4 text-sm text-yellow-800">
            Status booking kamu saat ini:{" "}
            <span className="font-bold">{getBookingStatusLabel(booking.status)}</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">Nama Pemesan</p>
              <p className="font-semibold">{booking.customerName}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Nomor HP</p>
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
              <p className="text-sm text-slate-500">Tanggal Main</p>
              <p className="font-semibold">{formatDateDisplay(booking.bookingDate)}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Durasi</p>
              <p className="font-semibold">{booking.totalSlots} jam</p>
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

          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-sm text-slate-500">Total Pembayaran</p>
            <p className="text-3xl font-black text-[#5D3FD3]">
              {formatRupiah(booking.totalPrice)}
            </p>
          </div>

          <div className="mt-8 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-700">Transfer Manual</p>
            <p className="mt-1">Bank: BCA</p>
            <p>No. Rekening: 1234567890</p>
            <p>Atas Nama: Threefrogs</p>
          </div>

          {(booking.status === "AWAITING_PAYMENT" ||
            booking.status === "PENDING_VERIFICATION") && (
            <div className="mt-8">
              <PaymentProofUploader
                bookingCode={booking.bookingCode}
                bookingStatus={booking.status}
                existingProofCount={booking.paymentProofs.length}
              />
            </div>
          )}

          {booking.paymentProofs.length > 0 ? (
            <div className="mt-8">
              <p className="mb-3 text-sm text-slate-500">Riwayat Bukti Pembayaran</p>

              <div className="space-y-3">
                {booking.paymentProofs.map((proof, index) => (
                  <div
                    key={proof.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {index === 0 ? "Bukti Terbaru" : proof.fileName || "Bukti Pembayaran"}
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
                          {getPaymentProofStatusLabel(proof.verificationStatus)}
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

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/my-bookings"
              className="rounded-2xl bg-[#5D3FD3] px-5 py-3 font-bold text-white"
            >
              Lihat Booking Saya
            </Link>

            <Link
              href="/reserve"
              className="rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-700"
            >
              Buat Booking Lagi
            </Link>

            <Link
              href="/"
              className="rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-700"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}