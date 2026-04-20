import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
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
            Pemantauan Pembayaran
          </p>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-[var(--tf-purple)] md:text-5xl">
                Kelola Status Pembayaran
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Pantau pembayaran yang masih menunggu, yang perlu ditinjau,
                dan yang sudah berhasil, agar penanganannya lebih cepat dan rapi.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Kembali ke Dashboard
              </Link>

              <Link
                href="/admin/payment-readiness"
                className="rounded-2xl bg-[var(--tf-purple)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--tf-purple-dark)]"
              >
                Lihat Kesiapan Pembayaran
              </Link>
            </div>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className={cardClass}>
            <p className="text-sm text-slate-500">Booking yang dipantau</p>
            <p className="mt-2 text-3xl font-black text-[var(--tf-purple)]">
              {summary.totalRecent}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm text-slate-500">Pembayaran otomatis</p>
            <p className="mt-2 text-3xl font-black text-blue-600">
              {summary.totalMidtrans}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm text-slate-500">Perlu ditindaklanjuti</p>
            <p className="mt-2 text-3xl font-black text-orange-600">
              {summary.gatewayNeedsAttention}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm text-slate-500">Pembayaran berhasil</p>
            <p className="mt-2 text-3xl font-black text-green-600">
              {summary.successfulGateway}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm text-slate-500">Manual perlu dicek</p>
            <p className="mt-2 text-3xl font-black text-yellow-600">
              {summary.manualNeedsVerification}
            </p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className={cardClass}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
                  Perlu Ditindaklanjuti
                </p>
                <h2 className="mt-2 text-2xl font-black text-[var(--tf-purple)]">
                  Pembayaran yang Masih Perlu Dipantau
                </h2>
              </div>

              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
                {gatewayNeedsAttention.length} booking
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {gatewayNeedsAttention.length === 0 ? (
                <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Saat ini tidak ada pembayaran otomatis yang memerlukan perhatian khusus.
                </div>
              ) : (
                gatewayNeedsAttention.map((booking) => (
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

                          <span className="rounded-full bg-[var(--tf-lavender)] px-3 py-1 text-xs font-bold text-[var(--tf-purple-dark)]">
                            {getPaymentProviderLabel(
                              booking.paymentGatewayProvider
                            )}
                          </span>

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
                          <p>
                            <span className="font-semibold text-slate-800">
                              Dibuat:
                            </span>{" "}
                            {formatDateTimeDisplay(booking.createdAt)}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-800">
                              Tindakan:
                            </span>{" "}
                            {getAdminPaymentActionLabel({
                              paymentGatewayProvider:
                                booking.paymentGatewayProvider,
                              status: booking.status,
                              paymentGatewayStatus:
                                booking.paymentGatewayStatus,
                            })}
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

                        <Link
                          href={`/booking/${booking.bookingCode}`}
                          className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700"
                        >
                          Lihat Halaman Customer
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={cardClass}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
                  Pembayaran Berhasil
                </p>
                <h2 className="mt-2 text-2xl font-black text-[var(--tf-purple)]">
                  Pembayaran Otomatis yang Sudah Berhasil
                </h2>
              </div>

              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                {successfulGatewayBookings.length} booking
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {successfulGatewayBookings.length === 0 ? (
                <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Belum ada pembayaran otomatis yang berhasil pada data terbaru ini.
                </div>
              ) : (
                successfulGatewayBookings.map((booking) => (
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

                          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
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
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/admin/bookings/${booking.id}`}
                          className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700"
                        >
                          Buka Detail
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
                Pembayaran Manual
              </p>
              <h2 className="mt-2 text-2xl font-black text-[var(--tf-purple)]">
                Pembayaran Manual yang Perlu Dicek
              </h2>
            </div>

            <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-bold text-yellow-700">
              {manualNeedsVerification.length} booking
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {manualNeedsVerification.length === 0 ? (
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Saat ini tidak ada pembayaran manual yang perlu ditinjau.
              </div>
            ) : (
              manualNeedsVerification.map((booking) => {
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
                              paymentGatewayStatus:
                                booking.paymentGatewayStatus,
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
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}