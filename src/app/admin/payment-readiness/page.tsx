import Link from "next/link";

export const dynamic = "force-dynamic";

function getBadgeClass(ok: boolean) {
  return ok
    ? "bg-green-50 text-green-700 border border-green-200"
    : "bg-red-50 text-red-700 border border-red-200";
}

function getBadgeText(ok: boolean) {
  return ok ? "Siap" : "Belum";
}

function hasValue(value?: string | null) {
  return Boolean(value && value.trim().length > 0);
}

export default function PaymentReadinessPage() {
  const paymentMode = process.env.PAYMENT_MODE ?? "MANUAL";
  const appBaseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const authUrl = process.env.AUTH_URL ?? "http://localhost:3000";

  const isMidtransMode = paymentMode === "MIDTRANS";
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

  const hasServerKey = hasValue(process.env.MIDTRANS_SERVER_KEY);
  const hasClientKey = hasValue(process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY);
  const hasMerchantId = hasValue(process.env.MIDTRANS_MERCHANT_ID);

  const hasFinishUrl = hasValue(process.env.MIDTRANS_FINISH_REDIRECT_URL);
  const hasUnfinishUrl = hasValue(process.env.MIDTRANS_UNFINISH_REDIRECT_URL);
  const hasErrorUrl = hasValue(process.env.MIDTRANS_ERROR_REDIRECT_URL);

  const configReady =
    isMidtransMode &&
    hasServerKey &&
    hasClientKey &&
    hasMerchantId &&
    hasFinishUrl &&
    hasUnfinishUrl &&
    hasErrorUrl;

  const isLocalTesting =
    appBaseUrl.includes("localhost") || appBaseUrl.includes("127.0.0.1");

  const expectedWebhookUrl = `${appBaseUrl}/api/payments/midtrans/notification`;

  const envChecks = [
    { label: "PAYMENT_MODE = MIDTRANS", ok: isMidtransMode },
    { label: "MIDTRANS_SERVER_KEY", ok: hasServerKey },
    { label: "NEXT_PUBLIC_MIDTRANS_CLIENT_KEY", ok: hasClientKey },
    { label: "MIDTRANS_MERCHANT_ID", ok: hasMerchantId },
    { label: "MIDTRANS_FINISH_REDIRECT_URL", ok: hasFinishUrl },
    { label: "MIDTRANS_UNFINISH_REDIRECT_URL", ok: hasUnfinishUrl },
    { label: "MIDTRANS_ERROR_REDIRECT_URL", ok: hasErrorUrl },
  ];

  return (
    <main className="min-h-screen bg-[var(--tf-bg)] px-6 py-16 text-slate-800">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="space-y-3">
          <p className="inline-flex rounded-full bg-[var(--tf-cream)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
            Payment Readiness
          </p>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-[var(--tf-purple)] md:text-5xl">
                Midtrans Readiness Checklist
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Halaman ini membantu memastikan setup Midtrans siap dipakai,
                baik untuk testing lokal maupun production.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Dashboard Admin
              </Link>

              <Link
                href="/admin/bookings"
                className="rounded-2xl bg-[var(--tf-purple)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--tf-purple-dark)]"
              >
                Cek Booking
              </Link>
            </div>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[var(--tf-shadow-card)]">
            <p className="text-sm text-slate-500">Mode Pembayaran</p>
            <p className="mt-2 text-2xl font-black text-[var(--tf-purple)]">
              {paymentMode}
            </p>
            <span
              className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${getBadgeClass(
                isMidtransMode
              )}`}
            >
              {isMidtransMode ? "Midtrans Aktif" : "Masih Manual"}
            </span>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[var(--tf-shadow-card)]">
            <p className="text-sm text-slate-500">Environment</p>
            <p className="mt-2 text-2xl font-black text-[var(--tf-purple)]">
              {isProduction ? "Production" : "Sandbox"}
            </p>
            <span className="mt-4 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
              {isProduction ? "Live Payment" : "Testing Mode"}
            </span>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[var(--tf-shadow-card)]">
            <p className="text-sm text-slate-500">APP_BASE_URL</p>
            <p className="mt-2 break-all text-sm font-semibold text-slate-900">
              {appBaseUrl}
            </p>
            <span className="mt-4 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
              {isLocalTesting ? "Local Testing" : "Remote Domain"}
            </span>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[var(--tf-shadow-card)]">
            <p className="text-sm text-slate-500">Overall Readiness</p>
            <p className="mt-2 text-2xl font-black text-[var(--tf-purple)]">
              {configReady ? "READY" : "CHECK"}
            </p>
            <span
              className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${getBadgeClass(
                configReady
              )}`}
            >
              {configReady ? "Config Lengkap" : "Masih Ada Yang Kurang"}
            </span>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
            <h2 className="text-2xl font-black text-[var(--tf-purple)]">
              Env Checklist
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">AUTH_URL</p>
                <p className="mt-2 break-all text-sm font-semibold text-slate-900">
                  {authUrl}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Expected Webhook URL</p>
                <p className="mt-2 break-all text-sm font-semibold text-slate-900">
                  {expectedWebhookUrl}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {envChecks.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col gap-3 rounded-[1.25rem] border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
                >
                  <p className="font-semibold text-slate-900">{item.label}</p>
                  <span
                    className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${getBadgeClass(
                      item.ok
                    )}`}
                  >
                    {getBadgeText(item.ok)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
              <h2 className="text-2xl font-black text-[var(--tf-purple)]">
                Local Testing Reminder
              </h2>

              <div className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  1. Jalankan <code>npm run dev</code>
                </div>
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  2. Jalankan <code>ngrok http 3000</code>
                </div>
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  3. Update Payment Notification URL di Midtrans ke URL ngrok
                  aktif + <code>/api/payments/midtrans/notification</code>
                </div>
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  4. Buat <strong>booking baru</strong>, jangan pakai booking lama
                </div>
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  5. Lakukan simulasi bayar sampai benar-benar sukses
                </div>
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  6. Cek terminal app, terminal ngrok, dan halaman booking
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
              <h2 className="text-2xl font-black text-[var(--tf-purple)]">
                Production Cutover Reminder
              </h2>

              <div className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  1. Ganti ke key <strong>production</strong>
                </div>
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  2. Set <code>MIDTRANS_IS_PRODUCTION=true</code>
                </div>
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  3. Notification URL harus pakai domain production, bukan ngrok
                </div>
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  4. Test 1 transaksi live nominal kecil
                </div>
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  5. Rotate credential yang sempat terekspos saat testing
                </div>
              </div>
            </section>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
          <h2 className="text-2xl font-black text-[var(--tf-purple)]">
            Common Failure Patterns
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <p className="font-bold text-slate-900">
                Sudah bayar, tapi status booking belum berubah
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Biasanya karena webhook belum masuk, ngrok mati, notification URL
                salah, atau browser kembali lebih cepat daripada settlement.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <p className="font-bold text-slate-900">
                Snap muncul, tapi flow masih seperti manual
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Biasanya booking dibuat saat mode masih manual, atau env Midtrans
                belum aktif penuh saat booking dibuat.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <p className="font-bold text-slate-900">
                Redirect selesai, tapi data belum update di Booking Saya
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Ini bisa terjadi kalau settlement webhook datang beberapa detik
                setelah browser redirect. Refresh status dulu.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <p className="font-bold text-slate-900">
                Testing lokal berhasil sekali, lalu gagal lagi
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Seringnya karena URL ngrok berubah, tetapi notification URL di
                dashboard Midtrans belum ikut diperbarui.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}