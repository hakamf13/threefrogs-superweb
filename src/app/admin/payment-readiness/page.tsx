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
    { label: "Metode pembayaran aktif", ok: isMidtransMode },
    { label: "Server key Midtrans", ok: hasServerKey },
    { label: "Client key Midtrans", ok: hasClientKey },
    { label: "Merchant ID Midtrans", ok: hasMerchantId },
    { label: "Halaman selesai pembayaran", ok: hasFinishUrl },
    { label: "Halaman pembayaran belum selesai", ok: hasUnfinishUrl },
    { label: "Halaman kendala pembayaran", ok: hasErrorUrl },
  ];

  return (
    <main className="min-h-screen bg-[var(--tf-bg)] px-6 py-16 text-slate-800">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="space-y-3">
          <p className="inline-flex rounded-full bg-[var(--tf-cream)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
            Kesiapan Pembayaran
          </p>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-[var(--tf-purple)] md:text-5xl">
                Periksa Kesiapan Sistem Pembayaran
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Halaman ini membantu memastikan pengaturan pembayaran sudah siap
                digunakan, baik saat uji coba maupun saat dipakai langsung.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Kembali ke Dashboard
              </Link>

              <Link
                href="/admin/bookings"
                className="rounded-2xl bg-[var(--tf-purple)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--tf-purple-dark)]"
              >
                Lihat Booking
              </Link>
            </div>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[var(--tf-shadow-card)]">
            <p className="text-sm text-slate-500">Metode pembayaran</p>
            <p className="mt-2 text-2xl font-black text-[var(--tf-purple)]">
              {paymentMode}
            </p>
            <span
              className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${getBadgeClass(
                isMidtransMode
              )}`}
            >
              {isMidtransMode ? "Sudah aktif" : "Belum aktif"}
            </span>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[var(--tf-shadow-card)]">
            <p className="text-sm text-slate-500">Mode sistem</p>
            <p className="mt-2 text-2xl font-black text-[var(--tf-purple)]">
              {isProduction ? "Produksi" : "Percobaan"}
            </p>
            <span className="mt-4 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
              {isProduction ? "Pembayaran aktif" : "Untuk pengujian"}
            </span>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[var(--tf-shadow-card)]">
            <p className="text-sm text-slate-500">Alamat website</p>
            <p className="mt-2 break-all text-sm font-semibold text-slate-900">
              {appBaseUrl}
            </p>
            <span className="mt-4 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
              {isLocalTesting ? "Lokal" : "Publik"}
            </span>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[var(--tf-shadow-card)]">
            <p className="text-sm text-slate-500">Kesiapan keseluruhan</p>
            <p className="mt-2 text-2xl font-black text-[var(--tf-purple)]">
              {configReady ? "Siap" : "Perlu dicek"}
            </p>
            <span
              className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${getBadgeClass(
                configReady
              )}`}
            >
              {configReady ? "Pengaturan lengkap" : "Masih ada yang perlu dilengkapi"}
            </span>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
            <h2 className="text-2xl font-black text-[var(--tf-purple)]">
              Pemeriksaan Pengaturan
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">AUTH_URL</p>
                <p className="mt-2 break-all text-sm font-semibold text-slate-900">
                  {authUrl}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Alamat notifikasi yang diharapkan</p>
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
                Saat Menguji di Perangkat Sendiri
              </h2>

              <div className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  1. Jalankan aplikasi terlebih dahulu.
                </div>
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  2. Aktifkan alamat publik sementara agar notifikasi pembayaran bisa masuk.
                </div>
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  3. Perbarui alamat notifikasi pembayaran sesuai alamat yang sedang aktif.
                </div>
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  4. Gunakan booking baru saat mencoba pembayaran.
                </div>
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  5. Selesaikan pembayaran hingga benar-benar berhasil.
                </div>
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  6. Pastikan status booking ikut berubah setelah pembayaran selesai.
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
              <h2 className="text-2xl font-black text-[var(--tf-purple)]">
                Saat Digunakan Langsung
              </h2>

              <div className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  1. Gunakan data pembayaran yang resmi dan aktif.
                </div>
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  2. Pastikan mode sistem sudah benar-benar untuk penggunaan langsung.
                </div>
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  3. Pastikan alamat notifikasi pembayaran mengarah ke domain resmi.
                </div>
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  4. Lakukan satu transaksi bernilai kecil sebagai uji akhir.
                </div>
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  5. Setelah semua aman, simpan dan rapikan kembali data rahasia yang pernah dipakai saat pengujian.
                </div>
              </div>
            </section>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
          <h2 className="text-2xl font-black text-[var(--tf-purple)]">
            Hal yang Sering Menyebabkan Kendala
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <p className="font-bold text-slate-900">
                Pembayaran sudah dilakukan, tetapi status booking belum berubah
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Biasanya terjadi karena pembaruan status belum masuk, alamat notifikasi tidak sesuai, atau halaman dibuka kembali lebih cepat daripada proses pembaruan.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <p className="font-bold text-slate-900">
                Halaman pembayaran muncul, tetapi alurnya tidak sesuai
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Biasanya karena booking dibuat saat pengaturan pembayaran belum aktif sepenuhnya.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <p className="font-bold text-slate-900">
                Kembali ke halaman booking, tetapi data belum terbarui
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Hal ini bisa terjadi bila pembaruan status masuk beberapa saat setelah pengguna kembali ke halaman sebelumnya.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <p className="font-bold text-slate-900">
                Pengujian sempat berhasil, lalu tidak berjalan lagi
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Umumnya karena alamat sementara yang dipakai saat pengujian sudah berubah, tetapi pengaturan notifikasi belum ikut diperbarui.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}