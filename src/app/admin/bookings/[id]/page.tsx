export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "../../../../../lib/prisma";
import AdminBookingActions from "./admin-booking-actions";
import {
  formatDateDisplay,
  formatHourLabel,
  formatRupiah,
  getBookingStatusColor,
  getBookingStatusLabel,
} from "../../../../../lib/utils";

type AdminBookingDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminBookingDetailPage({
  params,
}: AdminBookingDetailPageProps) {
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      store: true,
      table: true,
      slots: {
        orderBy: {
          slotHour: "asc",
        },
      },
      paymentProofs: {
        orderBy: {
          uploadedAt: "desc",
        },
      },
      statusLogs: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!booking) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#F8F4FF] px-6 py-16 text-slate-800">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm text-slate-500">Kode Booking</p>
              <h1 className="text-3xl font-black text-[#5D3FD3]">
                {booking.bookingCode}
              </h1>
            </div>

            <span
              className={`h-fit rounded-full px-4 py-2 text-sm font-bold ${getBookingStatusColor(
                booking.status
              )}`}
            >
              {getBookingStatusLabel(booking.status)}
            </span>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">Nama Pemesan</p>
              <p className="font-semibold">{booking.customerName}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">No. HP</p>
              <p className="font-semibold">{booking.customerPhone}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Store</p>
              <p className="font-semibold">{booking.store.name}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Meja</p>
              <p className="font-semibold">Meja {booking.table.tableNumber}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Tanggal</p>
              <p className="font-semibold">{formatDateDisplay(booking.bookingDate)}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Total</p>
              <p className="font-semibold">{formatRupiah(booking.totalPrice)}</p>
            </div>
          </div>

          <div className="mt-8">
            <p className="mb-3 text-sm text-slate-500">Slot Booking</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {booking.slots.map((slot) => (
                <div
                  key={slot.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <p className="font-semibold text-[#5D3FD3]">
                    {formatHourLabel(slot.slotHour)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <AdminBookingActions bookingId={booking.id} status={booking.status} />

        {booking.paymentProofs.length > 0 ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-[#5D3FD3]">
              Bukti Pembayaran
            </h2>

            <a
              href={booking.paymentProofs[0].fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-2xl border border-[#5D3FD3] px-4 py-3 font-semibold text-[#5D3FD3]"
            >
              Lihat Bukti Pembayaran
            </a>
          </div>
        ) : null}

        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-[#5D3FD3]">
            Riwayat Status
          </h2>

          <div className="space-y-4">
            {booking.statusLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <p className="font-semibold text-slate-800">
                  {log.oldStatus ? `${log.oldStatus} → ${log.newStatus}` : log.newStatus}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {log.note ?? "-"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}