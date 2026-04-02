export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import SiteHeader from "@/components/layout/site-header";
import { prisma } from "../../../../lib/prisma";
import {
  formatDateDisplay,
  formatHourLabel,
  formatRupiah,
  getBookingStatusColor,
  getBookingStatusLabel,
} from "../../../../lib/utils";
import CancelBookingButton from "./cancel-booking-button";

type MyBookingDetailPageProps = {
  params: Promise<{
    bookingCode: string;
  }>;
};

export default async function MyBookingDetailPage({
  params,
}: MyBookingDetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/my-bookings");
  }

  const { bookingCode } = await params;

  const booking = await prisma.booking.findFirst({
    where: {
      bookingCode,
      userId: session.user.id,
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
    <div className="min-h-screen bg-[#F8F4FF] text-slate-800">
      <SiteHeader />

      <main className="px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">Kode Booking</p>
              <h1 className="text-3xl font-black text-[#5D3FD3]">
                {booking.bookingCode}
              </h1>
            </div>

            <span
              className={`rounded-full px-4 py-2 text-sm font-bold ${getBookingStatusColor(
                booking.status
              )}`}
            >
              {getBookingStatusLabel(booking.status)}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
              <p className="text-sm text-slate-500">Total Pembayaran</p>
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

          {booking.paymentProofs.length > 0 ? (
            <div className="mt-8">
              <p className="mb-3 text-sm text-slate-500">Bukti Pembayaran</p>
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

          {(booking.status === "AWAITING_PAYMENT" ||
            booking.status === "PENDING_VERIFICATION") && (
            <div className="mt-8">
              <CancelBookingButton bookingCode={booking.bookingCode} />
            </div>
          )}

          <div className="mt-8">
            <Link
              href="/my-bookings"
              className="rounded-2xl border border-slate-300 px-4 py-2 font-semibold text-slate-700"
            >
              Kembali ke Booking Saya
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}