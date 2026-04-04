import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import { prisma } from "../../../lib/prisma";
import { expireOverdueBookings } from "@/features/reservations/expire-overdue-bookings";
import {
  formatDateDisplay,
  formatRupiah,
  getBookingStatusColor,
  getBookingStatusLabel,
} from "../../../lib/utils";
import EmptyStateCard from "@/components/ui/empty-state-card";

export const dynamic = "force-dynamic";

type MyBookingsPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    sort?: string;
  }>;
};

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

  const whereClause: any = {
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

  if (status) {
    whereClause.status = status;
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
    <div className="min-h-screen bg-[#F8F4FF] text-slate-800">
      <SiteHeader />

      <main className="px-6 py-16">
        <div className="mx-auto max-w-6xl space-y-8">
            <div>
                <p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
                    My Reservations
                </p>
                <h1 className="mt-3 text-4xl font-black text-[var(--tf-purple)]">
                    Booking Saya
                </h1>
                <p className="mt-2 text-slate-600">
                    Semua booking yang kamu buat saat login akan tampil di sini.
                </p>
            </div>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
            <form className="grid gap-4 lg:grid-cols-4">
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

              <div className="lg:col-span-4 flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="rounded-2xl bg-[#5D3FD3] px-5 py-3 font-bold text-white"
                >
                  Terapkan Filter
                </button>

                <Link
                  href="/my-bookings"
                  className="rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-700"
                >
                  Tampilkan Semua
                </Link>
              </div>
            </form>
          </section>

          <div className="space-y-4">
            {bookings.length === 0 ? (
            <EmptyStateCard
                eyebrow="No Results"
                title="Belum ada booking yang cocok"
                description="Coba ubah filter pencarianmu, atau buat reservasi baru kalau kamu belum punya jadwal main."
                actionHref="/reserve"
                actionLabel="Buat Reservasi"
            />
            ) : (
              bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-black text-[var(--tf-purple)]">
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

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-[var(--tf-lavender)] px-3 py-1 text-xs font-semibold text-[var(--tf-purple-dark)]">
                          {booking.store.name}
                        </span>
                        <span className="rounded-full bg-[var(--tf-cream)] px-3 py-1 text-xs font-semibold text-[var(--tf-orange-dark)]">
                          Meja {booking.table.tableNumber}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600">
                        {formatDateDisplay(booking.bookingDate)}
                      </p>

                      <p className="text-sm font-semibold text-slate-700">
                        {formatRupiah(booking.totalPrice)}
                      </p>
                    </div>

                    <div>
                        <Link
                            href={`/my-bookings/${booking.bookingCode}`}
                            className="rounded-2xl bg-[var(--tf-purple)] px-4 py-2 font-semibold text-white transition hover:bg-[var(--tf-purple-dark)]"
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

      <SiteFooter />
    </div>
  );
}