import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import EmptyStateCard from "@/components/ui/empty-state-card";
import BookingStatusChip from "@/components/bookings/booking-status-chip";
import {
  formatDateDisplay,
  formatDateTimeDisplay,
  formatRupiah,
  getAdminPaymentActionLabel,
  getPaymentGatewayStatusColor,
  getPaymentGatewayStatusLabel,
  getPaymentProviderLabel,
  isBookingNeedingAdminPaymentAction,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

const cardClass =
  "rounded-[1.75rem] border border-[var(--tf-border)] bg-white p-5 shadow-[var(--tf-shadow-card)]";

export default async function AdminPaymentOpsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login?callbackUrl=/admin/payment-ops");
  }

  const bookings = await prisma.booking.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 80,
    include: {
      store: true,
      table: true,
      paymentProofs: {
        orderBy: {
          uploadedAt: "desc",
        },
        take: 1,
      },
    },
  });

  const midtransBookings = bookings.filter(
    (booking) => booking.paymentGatewayProvider === "MIDTRANS"
  );

  const manualBookings = bookings.filter(
    (booking) => !booking.paymentGatewayProvider
  );

  const gatewayNeedsAttention = midtransBookings.filter((booking) => {
    const gatewayStatus = (booking.paymentGatewayStatus ?? "").toLowerCase();

    return (
      booking.status === "AWAITING_PAYMENT" ||
      gatewayStatus === "token_failed" ||
      gatewayStatus === "pending" ||
      gatewayStatus === "expire" ||
      gatewayStatus === "cancel" ||
      gatewayStatus === "deny" ||
      gatewayStatus === "failure"
    );
  });

  const successfulGatewayBookings = midtransBookings.filter((booking) => {
    const gatewayStatus = (booking.paymentGatewayStatus ?? "").toLowerCase();

    return (
      booking.status === "CONFIRMED" &&
      (gatewayStatus === "settlement" || gatewayStatus === "capture")
    );
  });

  const manualNeedsVerification = manualBookings.filter((booking) =>
    isBookingNeedingAdminPaymentAction({
      paymentGatewayProvider: booking.paymentGatewayProvider,
      status: booking.status,
    })
  );

  const summary = {
    totalRecent: bookings.length,
    totalMidtrans: midtransBookings.length,
    gatewayNeedsAttention: gatewayNeedsAttention.length,
    successfulGateway: successfulGatewayBookings.length,
    manualNeedsVerification: manualNeedsVerification.length,
  };

  return (
    <main className="min-h-screen bg-[var(--tf-bg)] px-6 py-16 text-slate-800">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="space-y-3">
          <p className="inline-flex rounded-full bg-[var(--tf-cream)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
            Operasional Pembayaran
          </p>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-[var(--tf-purple)] md:text-5xl">
                Pantau Pembayaran Booking
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Pantau booking Midtrans dan pembayaran manual dalam satu tempat.
                Fokus utamanya adalah melihat mana yang masih menunggu,
                mana yang perlu perhatian admin, dan mana yang sudah beres.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Dashboard Admin
              </Link>

              <Link
                href="/admin/payment-readiness"
                className="rounded-2xl bg-[var(--tf-purple)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--tf-purple-dark)]"
              >
                Payment Readiness
              </Link>
            </div>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className={cardClass}>
            <p className="text-sm text-slate-500">Booking terbaru dipantau</p>
            <p className="mt-2 text-3xl font-black text-[var(--tf-purple)]">
              {summary.totalRecent}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm text-slate-500">Midtrans terbaru</p>
            <p className="mt-2 text-3xl font-black text-blue-600">
              {summary.totalMidtrans}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm text-slate-500">Gateway perlu perhatian</p>
            <p className="mt-2 text-3xl font-black text-orange-600">
              {summary.gatewayNeedsAttention}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm text-slate-500">Midtrans sukses</p>
            <p className="mt-2 text-3xl font-black text-green-600">
              {summary.successfulGateway}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm text-slate-500">Manual perlu verifikasi</p>
            <p className="mt-2 text-3xl font-black text-yellow-600">
              {summary.manualNeedsVerification}
            </p>
          </div>
        </section>

        <section className={`${cardClass} space-y-5`}>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
              Midtrans
            </p>
            <h2 className="mt-2 text-2xl font-black text-[var(--tf-purple)]">
              Booking Midtrans yang Perlu Diperhatikan
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Fokus pada booking yang status gateway-nya masih menggantung,
              bermasalah, atau masih menunggu pembayaran.
            </p>
          </div>

          {gatewayNeedsAttention.length === 0 ? (
            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Tidak ada booking Midtrans yang perlu perhatian admin sekarang.
            </div>
          ) : (
            <div className="space-y-4">
              {gatewayNeedsAttention.map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-black text-slate-900">
                          {booking.bookingCode}
                        </p>

                        <BookingStatusChip status={booking.status} />

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getPaymentGatewayStatusColor(
                            booking.paymentGatewayStatus
                          )}`}
                        >
                          {getPaymentGatewayStatusLabel(
                            booking.paymentGatewayStatus
                          )}
                        </span>
                      </div>

                      <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                        <p>
                          <span className="font-semibold text-slate-800">
                            Store:
                          </span>{" "}
                          {booking.store.name}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-800">
                            Meja:
                          </span>{" "}
                          {booking.table.displayLabel ||
                            `Meja ${booking.table.tableNumber}`}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-800">
                            Tanggal:
                          </span>{" "}
                          {formatDateDisplay(booking.bookingDate)}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-800">
                            Total:
                          </span>{" "}
                          {formatRupiah(booking.totalPrice)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-[var(--tf-lavender)] px-3 py-1 text-xs font-semibold text-[var(--tf-purple-dark)]">
                          {getPaymentProviderLabel(booking.paymentGatewayProvider)}
                        </span>

                        <span className="rounded-full bg-[#FFF4DB] px-3 py-1 text-xs font-semibold text-[#C77A00]">
                          {getAdminPaymentActionLabel({
                            paymentGatewayProvider:
                              booking.paymentGatewayProvider,
                            status: booking.status,
                            paymentGatewayStatus: booking.paymentGatewayStatus,
                          })}
                        </span>
                      </div>

                      {booking.paymentRequestedAt ? (
                        <p className="text-sm text-slate-500">
                          Permintaan pembayaran dibuat{" "}
                          {formatDateTimeDisplay(booking.paymentRequestedAt)}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="rounded-2xl bg-[var(--tf-purple)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--tf-purple-dark)]"
                      >
                        Buka Detail
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={`${cardClass} space-y-5`}>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
              Manual Fallback
            </p>
            <h2 className="mt-2 text-2xl font-black text-[var(--tf-purple)]">
              Booking Manual yang Butuh Tindakan
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Fokus pada booking manual yang masih menunggu pembayaran
              atau menunggu verifikasi bukti pembayaran.
            </p>
          </div>

          {manualNeedsVerification.length === 0 ? (
            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Tidak ada booking manual yang butuh tindakan admin sekarang.
            </div>
          ) : (
            <div className="space-y-4">
              {manualNeedsVerification.map((booking) => {
                const latestProof = booking.paymentProofs[0] ?? null;

                return (
                  <div
                    key={booking.id}
                    className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-black text-slate-900">
                            {booking.bookingCode}
                          </p>

                          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
                            Manual
                          </span>

                          <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-bold text-yellow-700">
                            {getAdminPaymentActionLabel({
                              paymentGatewayProvider:
                                booking.paymentGatewayProvider,
                              status: booking.status,
                              paymentGatewayStatus: booking.paymentGatewayStatus,
                            })}
                          </span>
                        </div>

                        <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                          <p>
                            <span className="font-semibold text-slate-800">
                              Store:
                            </span>{" "}
                            {booking.store.name}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-800">
                              Meja:
                            </span>{" "}
                            {booking.table.displayLabel ||
                              `Meja ${booking.table.tableNumber}`}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-800">
                              Tanggal:
                            </span>{" "}
                            {formatDateDisplay(booking.bookingDate)}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-800">
                              Total:
                            </span>{" "}
                            {formatRupiah(booking.totalPrice)}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-800">
                              Bukti terakhir:
                            </span>{" "}
                            {latestProof
                              ? formatDateTimeDisplay(latestProof.uploadedAt)
                              : "Belum ada"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/admin/bookings/${booking.id}`}
                          className="rounded-2xl bg-[var(--tf-purple)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--tf-purple-dark)]"
                        >
                          Buka Detail
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className={`${cardClass} space-y-5`}>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
              Ringkasan
            </p>
            <h2 className="mt-2 text-2xl font-black text-[var(--tf-purple)]">
              Booking Pembayaran Terbaru
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Daftar ini membantu admin melihat konteks pembayaran terbaru
              tanpa perlu berpindah halaman terlalu sering.
            </p>
          </div>

          {bookings.length === 0 ? (
            <EmptyStateCard
              eyebrow="Pembayaran"
              title="Belum ada data pembayaran"
              description="Begitu ada booking, ringkasan pembayaran terbaru akan muncul di sini."
              actionHref="/admin"
              actionLabel="Kembali ke dashboard"
            />
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const needsAdminPaymentAction =
                  isBookingNeedingAdminPaymentAction({
                    paymentGatewayProvider: booking.paymentGatewayProvider,
                    status: booking.status,
                    // paymentGatewayStatus: booking.paymentGatewayStatus,
                  });
                const isMidtransBooking =
                  booking.paymentGatewayProvider === "MIDTRANS";

                return (
                  <div
                    key={booking.id}
                    className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-2xl font-bold text-[#5D3FD3]">
                            {booking.bookingCode}
                          </h2>

                          <BookingStatusChip status={booking.status} />

                          {needsAdminPaymentAction ? (
                            <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                              Perlu tindakan admin
                            </span>
                          ) : null}
                        </div>

                        <p className="font-semibold text-slate-800">
                          {booking.customerName}
                        </p>

                        <p className="text-sm text-slate-600">
                          {booking.store.name} •{" "}
                          {booking.table.displayLabel ||
                            `Meja ${booking.table.tableNumber}`}
                        </p>

                        <p className="text-sm text-slate-600">
                          {formatDateDisplay(booking.bookingDate)}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-[#EDE7FF] px-3 py-1 text-xs font-semibold text-[#5D3FD3]">
                            {getPaymentProviderLabel(
                              booking.paymentGatewayProvider
                            )}
                          </span>

                          <span className="rounded-full bg-[#FFF4DB] px-3 py-1 text-xs font-semibold text-[#C77A00]">
                            {getAdminPaymentActionLabel({
                              paymentGatewayProvider:
                                booking.paymentGatewayProvider,
                              status: booking.status,
                              paymentGatewayStatus: booking.paymentGatewayStatus,
                            })}
                          </span>

                          {isMidtransBooking ? (
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentGatewayStatusColor(
                                booking.paymentGatewayStatus
                              )}`}
                            >
                              {getPaymentGatewayStatusLabel(
                                booking.paymentGatewayStatus
                              )}
                            </span>
                          ) : null}
                        </div>

                        {isMidtransBooking ? (
                          <p className="text-sm text-slate-600">
                            Booking ini memakai Midtrans. Admin biasanya tidak
                            perlu memeriksa bukti pembayaran manual.
                          </p>
                        ) : (
                          <p className="text-sm text-slate-600">
                            Booking ini memakai alur manual fallback.
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/admin/bookings/${booking.id}`}
                          className="rounded-2xl border border-[#5D3FD3] px-4 py-2 font-semibold text-[#5D3FD3]"
                        >
                          Lihat Detail
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}