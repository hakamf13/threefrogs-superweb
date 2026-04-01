import Link from "next/link";
import { prisma } from "../../../../lib/prisma";
import {
  formatDateDisplay,
  formatHourLabel,
  getBookingStatusColor,
  getBookingStatusLabel,
} from "../../../../lib/utils";

export default async function AdminBookingsPage() {
  const bookings = await prisma.booking.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      store: true,
      table: true,
    },
  });

  return (
    <main className="min-h-screen bg-[#F8F4FF] px-6 py-16 text-slate-800">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="text-4xl font-black text-[#5D3FD3]">
            Daftar Booking
          </h1>
          <p className="mt-2 text-slate-600">
            Semua booking yang masuk akan tampil di sini.
          </p>
        </div>

        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 shadow-sm">
              <p className="text-slate-500">Belum ada booking masuk.</p>
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
                    <p className="text-sm text-slate-600">
                      {booking.store.name} • Meja {booking.table.tableNumber}
                    </p>
                    <p className="text-sm text-slate-600">
                      {formatDateDisplay(booking.bookingDate)}
                    </p>
                    <p className="text-sm text-slate-600">
                      {formatHourLabel(booking.startHour)} sampai{" "}
                      {String(booking.endHour).padStart(2, "0")}:00
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