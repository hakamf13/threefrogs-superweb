import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { expireOverdueBookings } from "@/features/reservations/expire-overdue-bookings";
import PaymentProofUploader from "@/components/payments/payment-proof-uploader";
import RegenerateMidtransButton from "@/components/payments/regenerate-midtrans-button";
import RefreshBookingStatusButton from "@/components/payments/refresh-booking-status-button";
import {
  formatDateDisplay,
  formatDateTimeDisplay,
  formatHourLabel,
  formatRupiah,
  getBookingStatusDescription,
  getBookingStatusLabel,
  getBookingStatusPanelClass,
  getPaymentGatewayStatusColor,
  getPaymentGatewayStatusDescription,
  getPaymentGatewayStatusLabel,
  getPaymentProofStatusColor,
  getPaymentProofStatusLabel,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

type BookingDetailPageProps = {
  params: Promise<{
    bookingCode: string;
  }>;
};

export default async function BookingDetailPage({
  params,
}: BookingDetailPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/my-bookings");
  }

  await expireOverdueBookings();

  const { bookingCode } = await params;

  const booking = await prisma.booking.findUnique({
    where: { bookingCode },
    include: {
      store: true,
      table: true,
      slots: {
        orderBy: { slotHour: "asc" },
      },
      paymentProofs: {
        orderBy: { uploadedAt: "desc" },
      },
    },
  });

  if (!booking) {
    notFound();
  }

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = booking.userId === session.user.id;

  if (!isAdmin && !isOwner) {
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

  const showMidtransRecoverCard =
    isMidtransBooking && booking.status === "AWAITING_PAYMENT";

  const showMidtransSuccessCard =
    isMidtransBooking && booking.status === "CONFIRMED";

  const showManualProofFallback =
    !booking.paymentGatewayProvider &&
    (booking.status === "AWAITING_PAYMENT" ||
      booking.status === "PENDING_VERIFICATION");

  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-slate-50">
        <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
              Detail Booking
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">
              {booking.bookingCode}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              Semua informasi booking dan pembayaranmu ditampilkan di halaman ini.
              Cek status booking, selesaikan pembayaran, atau unggah bukti bayar
              bila diperlukan.
            </p>
          </div>

          <div
            className={`mb-6 rounded-3xl border p-5 ${getBookingStatusPanelClass(
              booking.status
            )}`}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-semibold">
                {getBookingStatusLabel(booking.status)}
              </span>
              <span className="text-sm">
                {getBookingStatusDescription(booking.status)}
              </span>
            </div>

            {booking.status === "AWAITING_PAYMENT" && booking.expiresAt ? (
              <p className="mt-3 text-sm">
                Batas pembayaran: {formatDateTimeDisplay(booking.expiresAt)}
              </p>
            ) : null}

            {latestRejectedProof?.rejectionReason ? (
              <div className="mt-4 rounded-2xl bg-white/80 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Catatan dari admin
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {latestRejectedProof.rejectionReason}
                </p>
              </div>
            ) : null}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border bg-white p-6 lg:col-span-2">
              <h2 className="text-xl font-semibold text-slate-900">
                Ringkasan Booking
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">Nama pemesan</p>
                  <p className="font-medium text-slate-900">
                    {booking.customerName}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Nomor HP</p>
                  <p className="font-medium text-slate-900">
                    {booking.customerPhone}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Store</p>
                  <p className="font-medium text-slate-900">
                    {booking.store.name}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Meja</p>
                  <p className="font-medium text-slate-900">
                    {booking.table.displayLabel ||
                      `Meja ${booking.table.tableNumber}`}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Tanggal main</p>
                  <p className="font-medium text-slate-900">
                    {formatDateDisplay(booking.bookingDate)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Durasi</p>
                  <p className="font-medium text-slate-900">
                    {booking.totalSlots} jam
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-sm text-slate-500">Slot booking</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {booking.slots.map((slot) => (
                    <span
                      key={slot.id}
                      className="rounded-full border bg-slate-50 px-3 py-1 text-sm"
                    >
                      {formatHourLabel(slot.slotHour)}
                    </span>
                  ))}
                </div>
              </div>

              {booking.notes ? (
                <div className="mt-5">
                  <p className="text-sm text-slate-500">Catatan tambahan</p>
                  <p className="mt-1 text-slate-800">{booking.notes}</p>
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">
                Pembayaran
              </h2>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {formatRupiah(booking.totalPrice)}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Pastikan pembayaran diselesaikan sesuai metode yang tersedia agar
                booking bisa diproses dengan lancar.
              </p>

              {booking.paymentGatewayProvider === "MIDTRANS" ? (
                <div className="mt-6 rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Status pembayaran otomatis
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[var(--tf-lavender)] px-3 py-1 text-xs font-bold text-[var(--tf-purple-dark)]">
                      Midtrans
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${getPaymentGatewayStatusColor(
                        booking.paymentGatewayStatus
                      )}`}
                    >
                      {getPaymentGatewayStatusLabel(booking.paymentGatewayStatus)}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {getPaymentGatewayStatusDescription(
                      booking.paymentGatewayStatus
                    )}
                  </p>
                </div>
              ) : null}

              {showMidtransPendingCard ? (
                <div className="mt-6 rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Pembayaran Midtrans
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">
                    Selesaikan pembayaran
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Booking ini sudah terhubung ke Midtrans Snap. Lanjutkan ke
                    halaman pembayaran untuk menyelesaikan transaksi.
                  </p>
                  <p className="mt-3 text-sm font-medium text-slate-700">
                    Status Midtrans:{" "}
                    {getPaymentGatewayStatusLabel(booking.paymentGatewayStatus)}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <a
                      href={booking.paymentCheckoutUrl!}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
                    >
                      Bayar Sekarang
                    </a>

                    <RegenerateMidtransButton
                      bookingCode={booking.bookingCode}
                    />
                  </div>
                </div>
              ) : null}

              {!showMidtransPendingCard && showMidtransRecoverCard ? (
                <div className="mt-6 rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Pembayaran Midtrans
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">
                    Buat ulang link pembayaran
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Booking ini masih menunggu pembayaran, tetapi link checkout
                    aktif tidak tersedia. Buat ulang link pembayaran untuk
                    melanjutkan proses.
                  </p>
                  <p className="mt-3 text-sm font-medium text-slate-700">
                    Status Midtrans:{" "}
                    {getPaymentGatewayStatusLabel(booking.paymentGatewayStatus)}
                  </p>

                  <div className="mt-4">
                    <RegenerateMidtransButton
                      bookingCode={booking.bookingCode}
                      variant="primary"
                    />
                  </div>
                </div>
              ) : null}

              {showMidtransSuccessCard ? (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-800">
                    Pembayaran Midtrans
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-emerald-900">
                    Pembayaran berhasil diterima
                  </h3>
                  <p className="mt-2 text-sm text-emerald-800">
                    Booking ini telah dibayar melalui Midtrans dan sudah
                    dikonfirmasi otomatis oleh sistem.
                  </p>
                  <p className="mt-3 text-sm font-medium text-emerald-900">
                    Status Midtrans:{" "}
                    {getPaymentGatewayStatusLabel(booking.paymentGatewayStatus)}
                  </p>
                </div>
              ) : null}

              {!isMidtransBooking ? (
                <div className="mt-6 rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Pembayaran manual
                  </p>
                  <div className="mt-3 space-y-1 text-sm text-slate-700">
                    <p>Bank: BCA</p>
                    <p>No. Rekening: 1234567890</p>
                    <p>Atas Nama: Threefrogs</p>
                  </div>
                </div>
              ) : null}

              {showManualProofFallback ? (
                <div className="mt-6">
                  <PaymentProofUploader
                    bookingCode={booking.bookingCode}
                    bookingStatus={booking.status}
                    existingProofCount={booking.paymentProofs.length}
                  />
                </div>
              ) : null}
            </div>
          </div>

          {booking.paymentProofs.length > 0 ? (
            <div className="mt-6 rounded-3xl border bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">
                Riwayat Bukti Pembayaran
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Semua bukti pembayaran yang pernah diunggah akan tampil di sini.
              </p>

              <div className="mt-4 space-y-4">
                {booking.paymentProofs.map((proof, index) => (
                  <div
                    key={proof.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {index === 0
                            ? "Bukti pembayaran terbaru"
                            : proof.fileName || "Bukti pembayaran"}
                        </p>
                        <p className="text-sm text-slate-500">
                          {formatDateTimeDisplay(proof.uploadedAt)}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentProofStatusColor(
                          proof.verificationStatus
                        )}`}
                      >
                        {getPaymentProofStatusLabel(proof.verificationStatus)}
                      </span>
                    </div>

                    {proof.rejectionReason ? (
                      <p className="mt-3 text-sm text-rose-700">
                        Catatan: {proof.rejectionReason}
                      </p>
                    ) : null}

                    <a
                      href={proof.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex rounded-2xl border px-4 py-2 text-sm font-medium text-slate-900"
                    >
                      Lihat Bukti
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <RefreshBookingStatusButton />

            <Link
              href="/my-bookings"
              className="rounded-2xl border bg-white px-4 py-3 text-sm font-semibold text-slate-900"
            >
              Kembali ke Booking Saya
            </Link>

            <Link
              href="/reserve"
              className="rounded-2xl border bg-white px-4 py-3 text-sm font-semibold text-slate-900"
            >
              Buat Booking Baru
            </Link>

            <Link
              href="/"
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}