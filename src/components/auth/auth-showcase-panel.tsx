import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Store,
  WalletCards,
} from "lucide-react";

type AuthShowcasePanelMode = "login" | "register";

type AuthShowcasePanelProps = {
  mode?: AuthShowcasePanelMode;
};

export default function AuthShowcasePanel({
  mode = "login",
}: AuthShowcasePanelProps) {
  const isLogin = mode === "login";

  const eyebrow = isLogin ? "Akses akun" : "Buat akun";
  const title = isLogin
    ? "Masuk lebih cepat, booking lebih rapi."
    : "Daftar sekali, lanjut booking lebih mudah.";
  const description = isLogin
    ? "Login memudahkan kamu menyimpan data booking, mengecek status reservasi, dan mengelola pesanan tanpa perlu mengulang dari awal."
    : "Setelah punya akun, data pemesan akan tersimpan sehingga proses reservasi berikutnya terasa lebih cepat, lebih jelas, dan lebih nyaman.";
  const primaryHref = isLogin ? "/reserve" : "/login";
  const primaryLabel = isLogin ? "Lihat reservasi" : "Sudah punya akun?";
  const secondaryHref = "/stores";
  const secondaryLabel = "Lihat store";

  const highlights = isLogin
    ? [
        {
          icon: Store,
          title: "Pilih store favorit",
          description: "Lanjut ke reservasi tanpa perlu mulai dari nol.",
        },
        {
          icon: Clock3,
          title: "Cek slot lebih cepat",
          description: "Lihat meja dan jam yang masih tersedia dengan lebih praktis.",
        },
        {
          icon: ShieldCheck,
          title: "Booking tersimpan",
          description: "Status booking lebih mudah dicek kapan saja dari akunmu.",
        },
      ]
    : [
        {
          icon: WalletCards,
          title: "Data pemesan tersimpan",
          description: "Nama dan nomor HP tidak perlu diisi ulang setiap saat.",
        },
        {
          icon: Clock3,
          title: "Booking jadi lebih ringkas",
          description: "Alur reservasi terasa lebih cepat untuk sesi berikutnya.",
        },
        {
          icon: ShieldCheck,
          title: "Riwayat lebih mudah dicek",
          description: "Semua booking bisa dilihat lagi dari akun yang sama.",
        },
      ];

  return (
    <aside className="overflow-hidden rounded-[1.9rem] border border-[var(--tf-border)] bg-white shadow-[var(--tf-shadow-card)]">
      <div className="relative overflow-hidden bg-[linear-gradient(135deg,#6F2DBD_0%,#5D3FD3_55%,#6A35D4_100%)] px-6 py-7 text-white sm:px-8 sm:py-8">
        <div className="absolute -right-10 top-0 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-[#FFD23F]/15 blur-2xl" />

        <div className="relative z-10">
          <Image
            src="/logo-3frogs.png"
            alt="Threefrogs Mahjong & Boardgame"
            width={220}
            height={72}
            className="h-12 w-auto object-contain"
          />

          <p className="mt-5 text-sm font-bold uppercase tracking-[0.18em] text-white/78">
            {eyebrow}
          </p>

          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            {title}
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-7 text-white/85 sm:text-base sm:leading-8">
            {description}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={primaryHref}
              className="inline-flex items-center rounded-2xl bg-[#FFD23F] px-5 py-3 text-sm font-semibold text-[var(--tf-purple-dark)] transition hover:bg-[#FFE277]"
            >
              {primaryLabel}
            </Link>

            <Link
              href={secondaryHref}
              className="inline-flex items-center rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/14"
            >
              {secondaryLabel}
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-6 sm:p-8">
        {highlights.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-[1.25rem] border border-[var(--tf-border)] bg-[var(--tf-surface-muted)] p-4"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white p-3 text-[var(--tf-purple)] shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-bold text-[var(--tf-purple)]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        <div className="rounded-[1.25rem] border border-[#D9F2B4] bg-[#F7FFE9] p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-white p-3 text-[var(--tf-green-dark)] shadow-sm">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <div>
              <p className="font-bold text-[var(--tf-green-dark)]">
                Siap dipakai untuk customer maupun admin
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                Fokus utama saat ini adalah flow reservasi mahjong yang cepat,
                jelas, dan nyaman dipakai di berbagai ukuran layar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}