import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import { prisma } from "../../lib/prisma";
import { expireOverdueBookings } from "@/features/reservations/expire-overdue-bookings";
import {
  formatDateDisplay,
  formatRupiah,
  getPaymentGatewayStatusColor,
  getPaymentGatewayStatusLabel,
} from "../../lib/utils";
import EmptyStateCard from "@/components/ui/empty-state-card";
import CancelBookingButton from "@/components/reservations/cancel-booking-button";
import RegenerateMidtransButton from "@/components/payments/regenerate-midtrans-button";
import PaymentStatusSyncBanner from "@/components/payments/payment-status-sync-banner";
import { BookingStatus, Prisma } from "@prisma/client";
import BookingStatusChip from "@/components/bookings/booking-status-chip";

export const dynamic = "force-dynamic";

type MyBookingsPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    sort?: string;
    refresh?: string;
  }>;
};

const BOOKING_STATUS_VALUES: BookingStatus[] = [
  "AWAITING_PAYMENT",
  "PENDING_VERIFICATION",
  "CONFIRMED",
  "CANCELLED",
  "EXPIRED",
];

const summaryCardClass =
  "rounded-[1.6rem] border border-[var(--tf-border)] bg-white p-5 shadow-[var(--tf-shadow-card)]";

export default async function MyBookingsPage({
  searchParams,
}: MyBookingsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/my-bookings");
  }

  await expireOverdueBookings();

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const status = (params.status ?? "").trim();
  const sort = params.sort === "oldest" ? "oldest" : "newest";
  const refresh = (params.refresh ?? "").trim();

  const whereClause: Prisma.BookingWhereInput = {
    userId: session.user.id,
  };

  if (q) {
    whereClause.OR = [
      {
        bookingCode: {
          contains: q,
          mode: "insensitive",
        },
      },
      {
        customerName: {
          contains: q,
          mode: "insensitive",
        },
      },
      {
        customerPhone: {
          contains: q,
          mode: "insensitive",
        },
      },
    ];
  }

  if (status && BOOKING_STATUS_VALUES.includes(status as BookingStatus)) {
    whereClause.status = status as BookingStatus;
  }

  const bookings = await prisma.booking.findMany({
    where: whereClause,
    orderBy: {
      createdAt: sort === "oldest" ? "asc" : "desc",
    },
    include: {
      store: true,
      table: true,
    },
  });

  const summary = {
    total: bookings.length,
    awaitingPayment: bookings.filter((b) => b.status === "AWAITING_PAYMENT")
      .length,
    pendingVerification: bookings.filter(
      (b) => b.status === "PENDING_VERIFICATION"
    ).length,
    confirmed: bookings.filter((b) => b.status === "CONFIRMED").length,
  };

  return (
    <div className="min-h-screen bg-[var(--tf-bg)] text-slate-800">
      <SiteHeader />

      <main className="px-4 py-10 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-6xl space-y-8">
          <div className="space-y-3">
            <p className="inline-flex rounded-full bg-[var(--tf-cream)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
              My Reservations
            </p>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-[var(--tf-purple)] md:text-5xl">
                Booking Saya
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Semua booking yang kamu buat saat login akan muncul di sini.
                Kamu bisa cek status, lanjut bayar, lihat bukti pembayaran, atau
                membatalkan booking yang masih aktif.
              </p>
            </div>
          </div>

          <PaymentStatusSyncBanner enabled={refresh === "payment"} />

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className={summaryCardClass}>
              <p className="text-sm text-slate-500">Total booking</p>
              <p className="mt-2 text-3xl font-black text-[var(--tf-purple)]">
                {summary.total}
              </p>
            </div>

            <div className={summaryCardClass}>
              <p className="text-sm text-slate-500">Menunggu bayar</p>
              <p className="mt-2 text-3xl font-black text-orange-600">
                {summary.awaitingPayment}
              </p>
            </div>

            <div className={summaryCardClass}>
              <p className="text-sm text-slate-500">Menunggu verifikasi</p>
              <p className="mt-2 text-3xl font-black text-yellow-600">
                {summary.pendingVerification}
              </p>
            </div>

            <div className={summaryCardClass}>
              <p className="text-sm text-slate-500">Terkonfirmasi</p>
              <p className="mt-2 text-3xl font-black text-green-600">
                {summary.confirmed}
              </p>
            </div>
          </section>

          <form className="rounded-[1.9rem] border border-[var(--tf-border)] bg-white p-5 shadow-[var(--tf-shadow-card)]">
            <div className="grid gap-4 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <label
                  htmlFor="q"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Cari booking
                </label>
                <input
                  id="q"
                  name="q"
                  defaultValue={q}
                  placeholder="Kode booking, nama, atau nomor HP"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[var(--tf-purple)]"
                />
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={status}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[var(--tf-purple)]"
                >
                  <option value="">Semua status</option>
                  <option value="AWAITING_PAYMENT">Menunggu bayar</option>
                  <option value="PENDING_VERIFICATION">
                    Menunggu verifikasi
                  </option>
                  <option value="CONFIRMED">Terkonfirmasi</option>
                  <option value="CANCELLED">Dibatalkan</option>
                  <option value="EXPIRED">Kedaluwarsa</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="sort"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Urutan
                </label>
                <select
                  id="sort"
                  name="sort"
                  defaultValue={sort}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[var(--tf-purple)]"
                >
                  <option value="newest">Terbaru</option>
                  <option value="oldest">Terlama</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-2xl bg-[var(--tf-purple)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--tf-purple-dark)]"
              >
                Terapkan filter
              </button>

              <Link
                href="/my-bookings"
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Tampilkan semua
              </Link>
            </div>
          </form>

          {bookings.length === 0 ? (
            <EmptyStateCard
              eyebrow="Booking"
              title="Belum ada booking"
              description="Booking yang kamu buat akan muncul di halaman ini."
              actionHref="/reserve"
              actionLabel="Reservasi sekarang"
            />
          ) : (
            <div className="grid gap-5">
              {bookings.map((booking) => {
                const showMidtransPayButton =
                  booking.paymentGatewayProvider === "MIDTRANS" &&
                  booking.status === "AWAITING_PAYMENT" &&
                  !!booking.paymentCheckoutUrl;

                const showMidtransRegenerate =
                  booking.paymentGatewayProvider === "MIDTRANS" &&
                  booking.status === "AWAITING_PAYMENT";

                const canCancel =
                  booking.status === "AWAITING_PAYMENT" ||
                  booking.status === "PENDING_VERIFICATION" ||
                  booking.status === "CONFIRMED";

                return (
                  <div
                    key={booking.id}
                    className="rounded-[1.9rem] border border-[var(--tf-border)] bg-white p-5 shadow-[var(--tf-shadow-card)]"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-2xl font-black text-[var(--tf-purple)]">
                            {booking.bookingCode}
                          </h2>
                          <BookingStatusChip status={booking.status} />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
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
                            <p className="text-sm text-slate-500">Tanggal</p>
                            <p className="mt-1 font-semibold text-slate-900">
                              {formatDateDisplay(booking.bookingDate)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-[var(--tf-surface-muted)] p-4">
                            <p className="text-sm text-slate-500">Total</p>
                            <p className="mt-1 font-semibold text-slate-900">
                              {formatRupiah(booking.totalPrice)}
                            </p>
                          </div>
                        </div>

                        {booking.paymentGatewayProvider === "MIDTRANS" ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-full bg-[var(--tf-lavender)] px-3 py-1 text-xs font-bold text-[var(--tf-purple-dark)]">
                              Midtrans
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
                        ) : (
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            Transfer manual / upload bukti pembayaran
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3 lg:max-w-[320px] lg:justify-end">
                        {showMidtransPayButton ? (
                          <a
                            href={booking.paymentCheckoutUrl!}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900"
                          >
                            Bayar sekarang
                          </a>
                        ) : null}

                        {showMidtransRegenerate ? (
                          <RegenerateMidtransButton
                            bookingCode={booking.bookingCode}
                            label="Ulangi Link Bayar"
                          />
                        ) : null}

                        <Link
                          href={`/booking/${booking.bookingCode}`}
                          className="rounded-2xl bg-[var(--tf-purple)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--tf-purple-dark)]"
                        >
                          Lihat detail
                        </Link>

                        {canCancel ? (
                          <CancelBookingButton bookingCode={booking.bookingCode} />
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}