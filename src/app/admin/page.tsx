import Link from "next/link";
import { BookingStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { expireOverdueBookings } from "@/features/reservations/expire-overdue-bookings";
import {
  formatDateDisplay,
  formatHourLabel,
  formatRupiah,
} from "../../lib/utils";
import EmptyStateCard from "@/components/ui/empty-state-card";
import BookingStatusChip from "@/components/bookings/booking-status-chip";

export const dynamic = "force-dynamic";

type AdminBookingsPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    storeId?: string;
    date?: string;
    sort?: string;
  }>;
};

function getTodayDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateRange(dateString: string) {
  const start = new Date(`${dateString}T00:00:00.000Z`);
  const end = new Date(`${dateString}T23:59:59.999Z`);
  return { start, end };
}

const BOOKING_STATUS_VALUES: BookingStatus[] = [
  "AWAITING_PAYMENT",
  "PENDING_VERIFICATION",
  "CONFIRMED",
  "CANCELLED",
  "EXPIRED",
];

const cardClass =
  "rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[var(--tf-shadow-card)]";

export default async function AdminBookingsPage({
  searchParams,
}: AdminBookingsPageProps) {
  await expireOverdueBookings();

  const params = await searchParams;

  const q = (params.q ?? "").trim();
  const status = (params.status ?? "").trim();
  const storeId = (params.storeId ?? "").trim();
  const date = (params.date ?? "").trim();
  const sort = params.sort === "oldest" ? "oldest" : "newest";

  const today = getTodayDateString();
  const todayRange = getDateRange(today);

  const stores = await prisma.store.findMany({
    where: {
      isActive: true,
      category: "MAHJONG",
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      name: true,
    },
  });

  const whereClause: Prisma.BookingWhereInput = {};

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

  if (storeId) {
    whereClause.storeId = storeId;
  }

  if (date) {
    const { start, end } = getDateRange(date);
    whereClause.bookingDate = {
      gte: start,
      lte: end,
    };
  }

  const [
    bookings,
    todayBookingsCount,
    awaitingPaymentCount,
    pendingVerificationCount,
    activeWalkInCount,
  ] = await Promise.all([
    prisma.booking.findMany({
      where: whereClause,
      orderBy: {
        createdAt: sort === "oldest" ? "asc" : "desc",
      },
      include: {
        store: true,
        table: true,
      },
    }),
    prisma.booking.count({
      where: {
        bookingDate: {
          gte: todayRange.start,
          lte: todayRange.end,
        },
      },
    }),
    prisma.booking.count({
      where: {
        status: "AWAITING_PAYMENT",
      },
    }),
    prisma.booking.count({
      where: {
        status: "PENDING_VERIFICATION",
      },
    }),
    prisma.walkInSession.count({
      where: {
        status: "ACTIVE",
      },
    }),
  ]);

  const summary = {
    total: bookings.length,
    awaitingPayment: bookings.filter((b) => b.status === "AWAITING_PAYMENT")
      .length,
    pendingVerification: bookings.filter(
      (b) => b.status === "PENDING_VERIFICATION"
    ).length,
    confirmed: bookings.filter((b) => b.status === "CONFIRMED").length,
    cancelled: bookings.filter((b) => b.status === "CANCELLED").length,
    expired: bookings.filter((b) => b.status === "EXPIRED").length,
  };

  return (
    <main className="min-h-screen bg-[var(--tf-bg)] px-4 py-12 text-slate-800 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
              Dashboard Operasional
            </p>
            <h1 className="mt-3 text-4xl font-black text-[var(--tf-purple)]">
              Pusat Kendali Admin
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Pantau booking, pembayaran, walk-in, dan operasional harian dari
              satu tempat agar penanganan lebih cepat, lebih rapi, dan lebih mudah
              diprioritaskan.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/today-operations"
              className="rounded-2xl bg-[var(--tf-purple)] px-5 py-3 font-bold text-white transition hover:bg-[var(--tf-purple-dark)]"
            >
              Operasional Hari Ini
            </Link>
            <Link
              href="/admin/manual-booking"
              className="rounded-2xl border border-[var(--tf-purple)] px-5 py-3 font-bold text-[var(--tf-purple)]"
            >
              Buat Booking Manual
            </Link>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className={cardClass}>
            <p className="text-sm text-slate-500">Booking hari ini</p>
            <p className="mt-2 text-3xl font-black text-[var(--tf-purple)]">
              {todayBookingsCount}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm text-slate-500">Menunggu pembayaran</p>
            <p className="mt-2 text-3xl font-black text-orange-600">
              {awaitingPaymentCount}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm text-slate-500">Menunggu pengecekan</p>
            <p className="mt-2 text-3xl font-black text-yellow-600">
              {pendingVerificationCount}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm text-slate-500">Walk-in aktif</p>
            <p className="mt-2 text-3xl font-black text-[var(--tf-purple)]">
              {activeWalkInCount}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm text-slate-500">Store aktif</p>
            <p className="mt-2 text-3xl font-black text-slate-700">
              {stores.length}
            </p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/admin/payment-ops"
            className={`${cardClass} transition hover:-translate-y-[1px] hover:border-[var(--tf-purple)]`}
          >
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
              Pembayaran
            </p>
            <h2 className="mt-2 text-2xl font-black text-[var(--tf-purple)]">
              Pemantauan Pembayaran
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Cek pembayaran yang masih menunggu, yang perlu ditinjau,
              dan yang sudah berhasil.
            </p>
          </Link>

          <Link
            href="/admin/walk-in"
            className={`${cardClass} transition hover:-translate-y-[1px] hover:border-[var(--tf-purple)]`}
          >
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
              Walk-in
            </p>
            <h2 className="mt-2 text-2xl font-black text-[var(--tf-purple)]">
              Kelola Sesi Walk-in
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Buka sesi baru, atur pembayaran, pindahkan meja,
              dan tutup sesi dengan cepat.
            </p>
          </Link>

          <Link
            href="/admin/availability"
            className={`${cardClass} transition hover:-translate-y-[1px] hover:border-[var(--tf-purple)]`}
          >
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
              Ketersediaan
            </p>
            <h2 className="mt-2 text-2xl font-black text-[var(--tf-purple)]">
              Pantau Jadwal Meja
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Lihat slot meja per jam untuk membantu booking dan walk-in
              tanpa bentrok jadwal.
            </p>
          </Link>

          <Link
            href="/admin/stores"
            className={`${cardClass} transition hover:-translate-y-[1px] hover:border-[var(--tf-purple)]`}
          >
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
              Store
            </p>
            <h2 className="mt-2 text-2xl font-black text-[var(--tf-purple)]">
              Kelola Store
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Perbarui data store, jam operasional, dan meja aktif
              untuk menjaga operasional tetap akurat.
            </p>
          </Link>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className={cardClass}>
            <p className="text-sm text-slate-500">Hasil filter booking</p>
            <p className="mt-2 text-3xl font-black text-[var(--tf-purple)]">
              {summary.total}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm text-slate-500">Menunggu pembayaran</p>
            <p className="mt-2 text-3xl font-black text-orange-600">
              {summary.awaitingPayment}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm text-slate-500">Menunggu pengecekan</p>
            <p className="mt-2 text-3xl font-black text-yellow-600">
              {summary.pendingVerification}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm text-slate-500">Sudah dikonfirmasi</p>
            <p className="mt-2 text-3xl font-black text-green-600">
              {summary.confirmed}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm text-slate-500">Dibatalkan</p>
            <p className="mt-2 text-3xl font-black text-red-600">
              {summary.cancelled}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm text-slate-500">Kedaluwarsa</p>
            <p className="mt-2 text-3xl font-black text-slate-600">
              {summary.expired}
            </p>
          </div>
        </section>

        <section className="rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
          <div className="mb-5">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
              Daftar Booking
            </p>
            <h2 className="mt-2 text-2xl font-black text-[var(--tf-purple)]">
              Cari dan Saring Booking
            </h2>
            <p className="mt-2 max-w-2xl text-slate-600">
              Gunakan filter di bawah untuk menemukan booking yang ingin ditangani
              lebih cepat.
            </p>
          </div>

          <form className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Cari booking
              </label>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Masukkan kode booking, nama, atau nomor HP"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Status booking
              </label>
              <select
                name="status"
                defaultValue={status}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
              >
                <option value="">Semua status</option>
                <option value="AWAITING_PAYMENT">Menunggu pembayaran</option>
                <option value="PENDING_VERIFICATION">Menunggu pengecekan</option>
                <option value="CONFIRMED">Sudah dikonfirmasi</option>
                <option value="CANCELLED">Dibatalkan</option>
                <option value="EXPIRED">Kedaluwarsa</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Store
              </label>
              <select
                name="storeId"
                defaultValue={storeId}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
              >
                <option value="">Semua store</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Tanggal bermain
              </label>
              <input
                type="date"
                name="date"
                defaultValue={date}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Urutan
              </label>
              <select
                name="sort"
                defaultValue={sort}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
              >
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
              </select>
            </div>

            <div className="lg:col-span-5 flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-2xl bg-[var(--tf-purple)] px-5 py-3 font-bold text-white"
              >
                Tampilkan Hasil
              </button>

              <Link
                href="/admin"
                className="rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-700"
              >
                Reset Filter
              </Link>
            </div>
          </form>
        </section>

        <div className="space-y-4">
          {bookings.length === 0 ? (
            <EmptyStateCard
              eyebrow="Booking"
              title="Belum ada hasil yang sesuai"
              description="Coba ubah kata kunci, status, store, atau tanggal agar hasil yang tampil lebih sesuai."
              actionHref="/admin"
              actionLabel="Lihat semua booking"
            />
          ) : (
            bookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold text-[var(--tf-purple)]">
                        {booking.bookingCode}
                      </h2>
                      <BookingStatusChip status={booking.status} />
                    </div>

                    <p className="font-semibold text-slate-800">
                      {booking.customerName}
                    </p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                      <p>{booking.customerPhone}</p>
                      <p>{booking.store.name}</p>
                      <p>
                        {booking.table.displayLabel ||
                          `Meja ${booking.table.tableNumber}`}
                      </p>
                      <p>{formatDateDisplay(booking.bookingDate)}</p>
                    </div>

                    <p className="text-sm text-slate-600">
                      {formatHourLabel(booking.startHour)} sampai{" "}
                      {String(booking.endHour).padStart(2, "0")}:00
                    </p>

                    <p className="text-sm font-semibold text-slate-700">
                      {formatRupiah(booking.totalPrice)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/admin/bookings/${booking.id}`}
                      className="rounded-2xl border border-[var(--tf-purple)] px-4 py-2 font-semibold text-[var(--tf-purple)]"
                    >
                      Lihat Detail
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}