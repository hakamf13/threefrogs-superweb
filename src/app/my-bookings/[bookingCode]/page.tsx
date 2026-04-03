import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import PaymentProofUploader from "@/components/payments/payment-proof-uploader";
import { prisma } from "../../../../lib/prisma";
import { expireOverdueBookings } from "@/features/reservations/expire-overdue-bookings";
import {
  formatDateDisplay,
  formatDateTimeDisplay,
  formatHourLabel,
  formatRupiah,
  getBookingStatusColor,
  getBookingStatusDescription,
  getBookingStatusLabel,
  getBookingStatusPanelClass,
  getPaymentProofStatusColor,
  getPaymentProofStatusLabel,
} from "../../../../lib/utils";
import CancelBookingButton from "./cancel-booking-button";

export const dynamic = "force-dynamic";

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

  await expireOverdueBookings();

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

  const latestRejectedProof = booking.paymentProofs.find(
    (proof) => proof.verificationStatus === "REJECTED"
  );

  return (
    <div className="min-h-screen bg-[var(--tf-bg)] text-slate-800">
      <SiteHeader />

      <main className="px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[var(--tf-shadow-card)]">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-[var(--tf-orange-dark)]">
                Kode Booking
              </p>
              <h1 className="mt-2 text-3xl font-black text-[var(--tf-purple)]">
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

          <div
            className={`rounded-[1.5rem] border p-5 ${getBookingStatusPanelClass(
              booking.status
            )}`}
          >
            <p className="font-bold">{getBookingStatusLabel(booking.status)}</p>
            <p className="mt-2 text-sm leading-6">
              {getBookingStatusDescription(booking.status)}
            </p>

            {booking.status === "AWAITING_PAYMENT" && booking.expiresAt ? (
              <p className="mt-3 text-sm font-semibold">
                Batas upload pembayaran: {formatDateTimeDisplay(booking.expiresAt)}
              </p>
            ) : null}
          </div>

          {latestRejectedProof?.rejectionReason ? (
            <div className="mt-5 rounded-[1.5rem] border border-red-200 bg-red-50 p-5 text-red-700">
              <p className="font-bold">Catatan Admin</p>
              <p className="mt-2 text-sm leading-6">
                {latestRejectedProof.rejectionReason}
              </p>
            </div>
          ) : null}

          <div className="mt-8 grid gap-4 md:grid-cols-2">
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
                  <p className="font-semibold text-[var(--tf-purple)]">
                    {formatHourLabel(slot.slotHour)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {booking.notes ? (
            <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-500">Catatan Booking</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{booking.notes}</p>
            </div>
          ) : null}

          {(booking.status === "AWAITING_PAYMENT" ||
            booking.status === "PENDING_VERIFICATION") && (
            <div className="mt-8">
              <PaymentProofUploader
                bookingCode={booking.bookingCode}
                bookingStatus={booking.status}
                existingProofCount={booking.paymentProofs.length}
              />
            </div>
          )}

          {booking.paymentProofs.length > 0 ? (
            <div className="mt-8">
              <p className="mb-3 text-sm text-slate-500">Riwayat Bukti Pembayaran</p>

              <div className="space-y-3">
                {booking.paymentProofs.map((proof, index) => (
                  <div
                    key={proof.id}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {index === 0
                            ? "Bukti Terbaru"
                            : proof.fileName || "Bukti Pembayaran"}
                        </p>
                        <p className="text-sm text-slate-500">
                          {formatDateTimeDisplay(proof.uploadedAt)}
                        </p>
                        {proof.rejectionReason ? (
                          <p className="mt-1 text-sm text-slate-600">
                            Catatan: {proof.rejectionReason}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getPaymentProofStatusColor(
                            proof.verificationStatus
                          )}`}
                        >
                          {getPaymentProofStatusLabel(proof.verificationStatus)}
                        </span>

                        <a
                          href={proof.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-2xl border border-[var(--tf-purple)] px-4 py-2 font-semibold text-[var(--tf-purple)]"
                        >
                          Lihat
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {(booking.status === "AWAITING_PAYMENT" ||
            booking.status === "PENDING_VERIFICATION") && (
            <div className="mt-8">
              <CancelBookingButton bookingCode={booking.bookingCode} />
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/my-bookings"
              className="rounded-2xl bg-[var(--tf-purple)] px-5 py-3 font-bold text-white transition hover:bg-[var(--tf-purple-dark)]"
            >
              Kembali ke Booking Saya
            </Link>

            <Link
              href="/reserve"
              className="rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-700"
            >
              Buat Booking Lagi
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}