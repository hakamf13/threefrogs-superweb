import Link from "next/link";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";

export const dynamic = "force-dynamic";

export default function PaymentErrorPage() {
  return (
    <div className="min-h-screen bg-[var(--tf-bg)] text-slate-800">
      <SiteHeader />

      <main className="px-6 py-16">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[var(--tf-shadow-card)]">
          <p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
            Midtrans Payment
          </p>

          <h1 className="mt-3 text-3xl font-black text-[var(--tf-purple)]">
            Terjadi Kendala Saat Pembayaran
          </h1>

          <p className="mt-4 text-sm leading-7 text-slate-600">
            Sistem pembayaran mengembalikan status error. Booking kamu belum tentu
            gagal total, tapi pembayaran belum bisa dianggap berhasil sebelum ada
            update status dari gateway.
          </p>

          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Cek kembali status booking kamu. Kalau masih menunggu pembayaran,
            kamu bisa lanjut bayar lagi dari halaman detail booking.
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
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