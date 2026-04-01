import Link from "next/link";
import { prisma } from "../../../lib/prisma";

export default async function AdminDashboardPage() {
  const [totalBookings, awaitingPayment, pendingVerification, confirmed, cancelled] =
    await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({
        where: { status: "AWAITING_PAYMENT" },
      }),
      prisma.booking.count({
        where: { status: "PENDING_VERIFICATION" },
      }),
      prisma.booking.count({
        where: { status: "CONFIRMED" },
      }),
      prisma.booking.count({
        where: { status: "CANCELLED" },
      }),
    ]);

  const cards = [
    { label: "Total Booking", value: totalBookings },
    { label: "Menunggu Pembayaran", value: awaitingPayment },
    { label: "Menunggu Verifikasi", value: pendingVerification },
    { label: "Terkonfirmasi", value: confirmed },
    { label: "Dibatalkan", value: cancelled },
  ];

  return (
    <main className="min-h-screen bg-[#F8F4FF] px-6 py-16 text-slate-800">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-black text-[#5D3FD3]">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-slate-600">
              Ringkasan operasional booking Threefrogs.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/bookings"
              className="rounded-2xl bg-[#5D3FD3] px-5 py-3 font-bold text-white"
            >
              Lihat Semua Booking
            </Link>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-3xl bg-white p-6 shadow-sm"
            >
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="mt-2 text-3xl font-black text-[#5D3FD3]">
                {card.value}
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}