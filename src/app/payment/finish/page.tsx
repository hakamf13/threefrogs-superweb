import Link from "next/link";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import PaymentReturnStatusCard from "@/components/payments/payment-return-status-card";

export const dynamic = "force-dynamic";

export default function PaymentFinishPage() {
  return (
    <div className="min-h-screen bg-[var(--tf-bg)] text-slate-800">
      <SiteHeader />

      <main className="px-6 py-16">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[var(--tf-shadow-card)]">
          <PaymentReturnStatusCard variant="finish" />

          <div className="mt-3 flex flex-wrap gap-3">
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