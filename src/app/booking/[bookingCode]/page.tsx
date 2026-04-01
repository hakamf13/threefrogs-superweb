import { notFound } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import BookingProofUploader from "./proof-uploader";
import {
  formatDateDisplay,
  formatHourLabel,
  formatRupiah,
  getBookingStatusLabel,
} from "../../../../lib/utils";

type BookingDetailPageProps = {
  params: Promise<{
    bookingCode: string;
  }>;
};

export default async function BookingDetailPage({
  params,
}: BookingDetailPageProps) {
  const { bookingCode } = await params;

  const booking = await prisma.booking.findUnique({
    where: {
      bookingCode,
    },
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
    },
  });

  if (!booking) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#F8F4FF] px-6 py-16 text-slate-800">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-semibold text-slate-500">Kode Booking</p>
          <h1 className="text-3xl font-black text-[#5D3FD3]">
            {booking.bookingCode}
          </h1>
        </div>

        <div className="mb-8 rounded-2xl bg-yellow-50 p-4 text-sm text-yellow-800">
          Status booking kamu saat ini:{" "}
          <span className="font-bold">{getBookingStatusLabel(booking.status)}</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">Nama Pemesan</p>
            <p className="font-semibold">{booking.customerName}</p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Nomor HP</p>
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
            <p className="text-sm text-slate-500">Tanggal Main</p>
            <p className="font-semibold">{formatDateDisplay(booking.bookingDate)}</p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Durasi</p>
            <p className="font-semibold">{booking.totalSlots} jam</p>
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

        <div className="mt-8 border-t border-slate-200 pt-6">
          <p className="text-sm text-slate-500">Total Pembayaran</p>
          <p className="text-3xl font-black text-[#5D3FD3]">
            {formatRupiah(booking.totalPrice)}
          </p>
        </div>

        <div className="mt-8 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-700">Transfer Manual</p>
          <p className="mt-1">Bank: BCA</p>
          <p>No. Rekening: 1234567890</p>
          <p>Atas Nama: Threefrogs</p>
        </div>

        {booking.status === "AWAITING_PAYMENT" ? (
          <div className="mt-8">
            <BookingProofUploader bookingCode={booking.bookingCode} />
          </div>
        ) : null}

        {booking.paymentProofs.length > 0 ? (
          <div className="mt-8">
            <p className="mb-3 text-sm text-slate-500">Bukti Pembayaran Terakhir</p>
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
      </div>
    </main>
  );
}