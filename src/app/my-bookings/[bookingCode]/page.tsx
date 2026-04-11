import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import PaymentProofUploader from "@/components/payments/payment-proof-uploader";
import CancelBookingButton from "@/components/reservations/cancel-booking-button";
import BookingStatusChip from "@/components/bookings/booking-status-chip";
import { prisma } from "@/lib/prisma";
import { expireOverdueBookings } from "@/features/reservations/expire-overdue-bookings";
import {
  formatDateDisplay,
  formatDateTimeDisplay,
  formatHourLabel,
  formatRupiah,
  getBookingStatusDescription,
  getBookingStatusPanelClass,
  getPaymentGatewayStatusLabel,
  getPaymentProofStatusColor,
  getPaymentProofStatusLabel,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

type MyBookingDetailPageProps = {
  params: Promise<{
    bookingCode: string;
  }>;
};

const panelClass =
  "rounded-[2rem] border border-[var(--tf-border)] bg-[var(--tf-surface)] p-6 shadow-[var(--tf-shadow-card)]";

export default async function MyBookingDetailPage({
  params,
}: MyBookingDetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/my-bookings");
  }

  await expireOverdueBookings();

  const { bookingCode } = await params;

  const booking = await prisma.booking.findFirst({
    where: {
      bookingCode,
      userId: session.user.id,
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

  const latestRejectedProof = booking.paymentProofs.find(
    (proof) => proof.verificationStatus === "REJECTED"
  );

  const isMidtransBooking = booking.paymentGatewayProvider === "MIDTRANS";

  const showMidtransPendingCard =
    isMidtransBooking &&
    booking.status === "AWAITING_PAYMENT" &&
    !!booking.paymentCheckoutUrl;

  const showMidtransSuccessCard =
    isMidtransBooking && booking.status === "CONFIRMED";

  const showManualProofFallback =
    !booking.paymentGatewayProvider &&
    (booking.status === "AWAITING_PAYMENT" ||
      booking.status === "PENDING_VERIFICATION");

  const canCancel =
    booking.status === "AWAITING_PAYMENT" ||
    booking.status === "PENDING_VERIFICATION" ||
    booking.status === "CONFIRMED";

  return (
    <div className="min-h-screen bg-[var(--tf-bg)] text-slate-800">
      <SiteHeader />

      <main className="px-4 py-10 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-6xl space-y-8">
          <div className="space-y-3">
            <p className="inline-flex rounded-full bg-[var(--tf-cream)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
              Booking Detail
            </p>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm text-slate-500">Kode Booking</p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-[var(--tf-purple)] md:text-5xl">
                  {booking.bookingCode}
                </h1>
              </div>

              <BookingStatusChip status={booking.status} />
            </div>
          </div>

          <div
            className={`rounded-[2rem] border p-5 ${getBookingStatusPanelClass(
              booking.status
            )}`}
          >
            <p className="font-bold text-slate-900">Status booking</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {getBookingStatusDescription(booking.status)}
            </p>

            {booking.status === "AWAITING_PAYMENT" && booking.expiresAt ? (
              <p className="mt-3 text-sm font-semibold text-slate-800">
                Batas pembayaran: {formatDateTimeDisplay(booking.expiresAt)}
              </p>
            ) : null}
          </div>

          {latestRejectedProof?.rejectionReason ? (
            <div className="rounded-[1.6rem] border border-red-200 bg-red-50 p-5 text-red-700">
              <p className="font-bold">Catatan admin</p>
              <p className="mt-2 text-sm leading-6">
                {latestRejectedProof.rejectionReason}
              </p>
            </div>
          ) : null}

          <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-6">
              <div className={panelClass}>
                <h2 className="text-2xl font-black text-[var(--tf-purple)]">
                  Detail Booking
                </h2>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[var(--tf-surface-muted)] p-4">
                    <p className="text-sm text-slate-500">Store</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {booking.store.name}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[var(--tf-surface-muted)] p-4">
                    <p className="text-sm text-slate-500">Meja</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {booking.table.displayLabel ||
                        `Meja ${booking.table.tableNumber}`}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[var(--tf-surface-muted)] p-4">
                    <p className="text-sm text-slate-500">Tanggal main</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {formatDateDisplay(booking.bookingDate)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[var(--tf-surface-muted)] p-4">
                    <p className="text-sm text-slate-500">Total pembayaran</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {formatRupiah(booking.totalPrice)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-[var(--tf-surface-muted)] p-4">
                  <p className="text-sm text-slate-500">Slot booking</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {booking.slots.map((slot) => (
                      <span
                        key={slot.id}
                        className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[var(--tf-purple-dark)] shadow-sm"
                      >
                        {formatHourLabel(slot.slotHour)}
                      </span>
                    ))}
                  </div>
                </div>

                {booking.notes ? (
                  <div className="mt-5 rounded-2xl bg-[var(--tf-surface-muted)] p-4">
                    <p className="text-sm text-slate-500">Catatan booking</p>
                    <p className="mt-2 text-sm leading-7 text-slate-800">
                      {booking.notes}
                    </p>
                  </div>
                ) : null}
              </div>

              {booking.paymentProofs.length > 0 ? (
                <div className={panelClass}>
                  <h2 className="text-2xl font-black text-[var(--tf-purple)]">
                    Riwayat Bukti Pembayaran
                  </h2>

                  <div className="mt-5 space-y-4">
                    {booking.paymentProofs.map((proof, index) => (
                      <div
                        key={proof.id}
                        className="rounded-[1.5rem] border border-[var(--tf-border)] bg-[var(--tf-surface-muted)] p-4"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {index === 0
                                ? "Bukti terbaru"
                                : proof.fileName || "Bukti pembayaran"}
                            </p>
                            <p className="text-sm text-slate-500">
                              {formatDateTimeDisplay(proof.uploadedAt)}
                            </p>
                            {proof.rejectionReason ? (
                              <p className="mt-2 text-sm text-slate-600">
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
                              className="rounded-2xl border border-[var(--tf-purple)] px-4 py-2 text-sm font-semibold text-[var(--tf-purple)]"
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
            </div>

            <aside className="xl:sticky xl:top-24">
              <div className={`${panelClass} space-y-5`}>
                <div>
                  <p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
                    Pembayaran
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-[var(--tf-purple)]">
                    Total Pembayaran
                  </h2>
                  <p className="mt-3 text-4xl font-black tracking-tight text-slate-900">
                    {formatRupiah(booking.totalPrice)}
                  </p>
                </div>

                {showMidtransPendingCard ? (
                  <div className="rounded-2xl border border-slate-200 bg-[var(--tf-surface-muted)] p-4">
                    <h3 className="text-lg font-black text-slate-900">
                      Pembayaran Midtrans
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Booking ini memakai Midtrans Snap. Klik tombol di bawah
                      untuk menyelesaikan pembayaran.
                    </p>
                    <p className="mt-3 text-sm font-medium text-slate-700">
                      Status gateway:{" "}
                      {getPaymentGatewayStatusLabel(booking.paymentGatewayStatus)}
                    </p>

                    <a
                      href={booking.paymentCheckoutUrl!}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex rounded-2xl bg-[var(--tf-purple)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--tf-purple-dark)]"
                    >
                      Bayar sekarang
                    </a>
                  </div>
                ) : null}

                {showMidtransSuccessCard ? (
                  <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
                    <h3 className="text-lg font-black">Pembayaran berhasil</h3>
                    <p className="mt-2 text-sm leading-6">
                      Booking ini telah dibayar melalui Midtrans dan terkonfirmasi
                      otomatis oleh sistem.
                    </p>
                    <p className="mt-3 text-sm font-medium">
                      Status gateway:{" "}
                      {getPaymentGatewayStatusLabel(booking.paymentGatewayStatus)}
                    </p>
                  </div>
                ) : null}

                {!isMidtransBooking ? (
                  <div className="rounded-2xl border border-slate-200 bg-[var(--tf-surface-muted)] p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Transfer manual
                    </p>
                    <div className="mt-3 space-y-1 text-sm text-slate-700">
                      <p>Bank: BCA</p>
                      <p>No. Rekening: 1234567890</p>
                      <p>Atas Nama: Threefrogs</p>
                    </div>
                  </div>
                ) : null}

                {showManualProofFallback ? (
                  <PaymentProofUploader
                    bookingCode={booking.bookingCode}
                    bookingStatus={booking.status}
                    existingProofCount={booking.paymentProofs.length}
                  />
                ) : null}

                {canCancel ? (
                  <CancelBookingButton bookingCode={booking.bookingCode} />
                ) : null}

                <div className="rounded-2xl bg-slate-50 p-4 text-xs leading-6 text-slate-600">
                  <p>• Simpan kode booking untuk memudahkan pengecekan.</p>
                  <p>• Kalau bukti bayar ditolak, kamu bisa upload ulang.</p>
                  <p>• Booking yang belum dibayar akan otomatis kedaluwarsa.</p>
                </div>
              </div>
            </aside>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/my-bookings"
              className="rounded-2xl bg-[var(--tf-purple)] px-5 py-3 font-bold text-white transition hover:bg-[var(--tf-purple-dark)]"
            >
              Kembali ke Booking Saya
            </Link>

            <Link
              href="/reserve"
              className="rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-700"
            >
              Buat booking lagi
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}