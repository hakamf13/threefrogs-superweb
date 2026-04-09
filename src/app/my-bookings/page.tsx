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
  getBookingStatusColor,
  getBookingStatusLabel,
  getPaymentGatewayStatusLabel,
} from "../../lib/utils";
import EmptyStateCard from "@/components/ui/empty-state-card";
import CancelBookingButton from "@/components/reservations/cancel-booking-button";
import { BookingStatus, Prisma } from "@prisma/client";
import BookingStatusChip from "@/components/bookings/bookings-status-chip";

export const dynamic = "force-dynamic";

type MyBookingsPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    sort?: string;
  }>;
};

const BOOKING_STATUS_VALUES: BookingStatus[] = [
  "AWAITING_PAYMENT",
  "PENDING_VERIFICATION",
  "CONFIRMED",
  "CANCELLED",
  "EXPIRED",
];

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

  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-slate-50">
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-500">
              My Reservations
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Booking Saya
            </h1>
            <p className="mt-2 text-slate-600">
              Semua booking yang kamu buat saat login akan tampil di sini.
            </p>
          </div>

          <form className="mb-6 rounded-3xl border bg-white p-4 shadow-sm">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="md:col-span-2">
                <label
                  htmlFor="q"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Cari Booking
                </label>
                <input
                  id="q"
                  name="q"
                  defaultValue={q}
                  placeholder="Kode booking, nama, atau nomor HP"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
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
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                >
                  <option value="">Semua Status</option>
                  <option value="AWAITING_PAYMENT">Menunggu Bayar</option>
                  <option value="PENDING_VERIFICATION">
                    Menunggu Verif
                  </option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="EXPIRED">Expired</option>
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
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                >
                  <option value="newest">Terbaru</option>
                  <option value="oldest">Terlama</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
              >
                Terapkan Filter
              </button>

              <Link
                href="/my-bookings"
                className="rounded-2xl border bg-white px-4 py-3 text-sm font-semibold text-slate-900"
              >
                Tampilkan Semua
              </Link>
            </div>
          </form>

          {bookings.length === 0 ? (
            <EmptyStateCard
              title="Belum ada booking"
              description="Booking yang kamu buat akan muncul di halaman ini."
              actionHref="/reserve"
              actionLabel="Reserve Sekarang"
            />
          ) : (
            <div className="grid gap-4">
              {bookings.map((booking) => {
                const showMidtransPayButton =
                  booking.paymentGatewayProvider === "MIDTRANS" &&
                  booking.status === "AWAITING_PAYMENT" &&
                  !!booking.paymentCheckoutUrl;

                const canCancel =
                  booking.status === "AWAITING_PAYMENT" ||
                  booking.status === "PENDING_VERIFICATION" ||
                  booking.status === "CONFIRMED";

                return (
                  <div
                    key={booking.id}
                    className="rounded-3xl border bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">
                          {booking.bookingCode}
                        </h2>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <BookingStatusChip status={booking.status} />
                        </div>

                        <div className="mt-4 space-y-1 text-sm text-slate-600">
                          <p>
                            {booking.store.name} • Meja{" "}
                            {booking.table.displayLabel ||
                              booking.table.tableNumber}
                          </p>
                          <p>{formatDateDisplay(booking.bookingDate)}</p>
                          <p>{formatRupiah(booking.totalPrice)}</p>

                          {booking.paymentGatewayProvider === "MIDTRANS" ? (
                            <p>
                              Midtrans •{" "}
                              {getPaymentGatewayStatusLabel(
                                booking.paymentGatewayStatus
                              )}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {showMidtransPayButton ? (
                          <a
                            href={booking.paymentCheckoutUrl!}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-2xl border bg-white px-4 py-3 text-sm font-semibold text-slate-900"
                          >
                            Bayar Sekarang
                          </a>
                        ) : null}

                        <Link
                          href={`/booking/${booking.bookingCode}`}
                          className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
                        >
                          Lihat Detail
                        </Link>

                        {canCancel ? (
                          <CancelBookingButton
                            bookingCode={booking.bookingCode}
                          />
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
    </>
  );
}