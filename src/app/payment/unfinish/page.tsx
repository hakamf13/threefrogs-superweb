import Link from "next/link";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import RefreshBookingStatusButton from "@/components/payments/refresh-booking-status-button";

export const dynamic = "force-dynamic";

export default function PaymentUnfinishPage() {
  return (
    <div className="min-h-screen bg-[var(--tf-bg)] text-slate-800">
      <SiteHeader />

      <main className="px-6 py-16">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[var(--tf-shadow-card)]">
          <p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
            Midtrans Payment
          </p>

          <h1 className="mt-3 text-3xl font-black text-[var(--tf-purple)]">
            Pembayaran Belum Selesai
          </h1>

          <p className="mt-4 text-sm leading-7 text-slate-600">
            Kamu keluar dari halaman pembayaran sebelum prosesnya selesai, atau
            pembayaran masih tertahan di sisi gateway. Booking kamu belum hilang,
            jadi cek statusnya dulu.
          </p>

          <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            Kalau kamu sebenarnya sudah membayar, tunggu beberapa detik lalu
            refresh status booking.
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <RefreshBookingStatusButton />
            <Link
              href="/my-bookings"
              className="rounded-2xl bg-[var(--tf-purple)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--tf-purple-dark)]"
            >
              Cek Booking Saya
            </Link>
            <Link
              href="/"
              className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}