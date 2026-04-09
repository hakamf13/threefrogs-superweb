export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import {
  formatDateDisplay,
  formatHourLabel,
  getAdminPaymentActionLabel,
  getBookingStatusColor,
  getBookingStatusLabel,
  getPaymentGatewayStatusLabel,
  getPaymentProviderLabel,
  isBookingNeedingAdminPaymentAction,
} from "../../../lib/utils";
import { expireOverdueBookings } from "@/features/reservations/expire-overdue-bookings";
import EmptyStateCard from "@/components/ui/empty-state-card";
import BookingStatusChip from "@/components/bookings/bookings-status-chip";


export default async function AdminBookingsPage() {
  await expireOverdueBookings();

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
            <EmptyStateCard
              eyebrow="No Results"
              title="Tidak ada booking yang cocok"
              description="Coba ubah keyword, status, store, atau tanggal supaya hasil pencarian lebih sesuai."
              actionHref="/admin/bookings"
              actionLabel="Tampilkan Semua"
            />
          ) : (
            bookings.map((booking) => {
              const needsAdminPaymentAction =
                isBookingNeedingAdminPaymentAction(booking);
              const isMidtransBooking =
                booking.paymentGatewayProvider === "MIDTRANS";

              return (
                <div
                  key={booking.id}
                  className="rounded-3xl bg-white p-6 shadow-sm"
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
                            Perlu Action Admin
                          </span>
                        ) : null}
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

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#EDE7FF] px-3 py-1 text-xs font-semibold text-[#5D3FD3]">
                          {getPaymentProviderLabel(
                            booking.paymentGatewayProvider
                          )}
                        </span>

                        <span className="rounded-full bg-[#FFF4DB] px-3 py-1 text-xs font-semibold text-[#C77A00]">
                          {getAdminPaymentActionLabel(booking)}
                        </span>

                        {isMidtransBooking ? (
                          <span className="rounded-full bg-[#EAF8DE] px-3 py-1 text-xs font-semibold text-[#4F8A10]">
                            {getPaymentGatewayStatusLabel(
                              booking.paymentGatewayStatus
                            )}
                          </span>
                        ) : null}
                      </div>

                      {isMidtransBooking ? (
                        <p className="text-sm text-slate-600">
                          Booking ini memakai Midtrans. Admin tidak perlu cek
                          mutasi manual.
                        </p>
                      ) : (
                        <p className="text-sm text-slate-600">
                          Booking ini memakai flow manual fallback.
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
            })
          )}
        </div>
      </div>
    </main>
  );
}