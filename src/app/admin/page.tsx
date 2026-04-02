import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { expireOverdueBookings } from "@/features/reservations/expire-overdue-bookings";
import {
  formatDateDisplay,
  formatHourLabel,
  formatRupiah,
  getBookingStatusColor,
  getBookingStatusLabel,
} from "../../../lib/utils";

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

  const whereClause: any = {};

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

  if (status) {
    whereClause.status = status;
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
    awaitingPayment: bookings.filter((b) => b.status === "AWAITING_PAYMENT").length,
    pendingVerification: bookings.filter((b) => b.status === "PENDING_VERIFICATION").length,
    confirmed: bookings.filter((b) => b.status === "CONFIRMED").length,
    cancelled: bookings.filter((b) => b.status === "CANCELLED").length,
    expired: bookings.filter((b) => b.status === "EXPIRED").length,
  };

  return (
    <main className="min-h-screen bg-[#F8F4FF] px-6 py-16 text-slate-800">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-4xl font-black text-[#5D3FD3]">
              Daftar Booking
            </h1>
            <p className="mt-2 text-slate-600">
              Cari dan filter booking untuk operasional harian.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/manual-booking"
              className="rounded-2xl bg-[#5D3FD3] px-5 py-3 font-bold text-white"
            >
              Manual Booking
            </Link>
            <Link
              href="/admin/availability"
              className="rounded-2xl border border-[#5D3FD3] px-5 py-3 font-bold text-[#5D3FD3]"
            >
              Availability
            </Link>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total</p>
            <p className="mt-2 text-3xl font-black text-[#5D3FD3]">
              {summary.total}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Menunggu Bayar</p>
            <p className="mt-2 text-3xl font-black text-orange-600">
              {summary.awaitingPayment}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Menunggu Verif</p>
            <p className="mt-2 text-3xl font-black text-yellow-600">
              {summary.pendingVerification}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Confirmed</p>
            <p className="mt-2 text-3xl font-black text-green-600">
              {summary.confirmed}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Cancelled</p>
            <p className="mt-2 text-3xl font-black text-red-600">
              {summary.cancelled}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Expired</p>
            <p className="mt-2 text-3xl font-black text-slate-600">
              {summary.expired}
            </p>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <form className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Cari Booking
              </label>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Kode booking / nama / no. HP"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#5D3FD3]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                name="status"
                defaultValue={status}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#5D3FD3]"
              >
                <option value="">Semua Status</option>
                <option value="AWAITING_PAYMENT">Menunggu Bayar</option>
                <option value="PENDING_VERIFICATION">Menunggu Verif</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Store
              </label>
              <select
                name="storeId"
                defaultValue={storeId}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#5D3FD3]"
              >
                <option value="">Semua Store</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Tanggal Main
              </label>
              <input
                type="date"
                name="date"
                defaultValue={date}
                max={getTodayDateString()}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#5D3FD3]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Urutan
              </label>
              <select
                name="sort"
                defaultValue={sort}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#5D3FD3]"
              >
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
              </select>
            </div>

            <div className="lg:col-span-5 flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-2xl bg-[#5D3FD3] px-5 py-3 font-bold text-white"
              >
                Terapkan Filter
              </button>

              <Link
                href="/admin/bookings"
                className="rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-700"
              >
                Reset
              </Link>
            </div>
          </form>
        </section>

        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 shadow-sm">
              <p className="text-slate-500">
                Tidak ada booking yang cocok dengan filter ini.
              </p>
            </div>
          ) : (
            bookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-3xl bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold text-[#5D3FD3]">
                        {booking.bookingCode}
                      </h2>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${getBookingStatusColor(
                          booking.status
                        )}`}
                      >
                        {getBookingStatusLabel(booking.status)}
                      </span>
                    </div>

                    <p className="font-semibold text-slate-800">
                      {booking.customerName}
                    </p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                      <p>{booking.customerPhone}</p>
                      <p>{booking.store.name}</p>
                      <p>Meja {booking.table.tableNumber}</p>
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
                      className="rounded-2xl border border-[#5D3FD3] px-4 py-2 font-semibold text-[#5D3FD3]"
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