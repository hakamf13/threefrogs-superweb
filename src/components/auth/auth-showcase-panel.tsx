type AuthShowcasePanelProps = {
  mode: "login" | "register";
};

export default function AuthShowcasePanel({
  mode,
}: AuthShowcasePanelProps) {
  const isLogin = mode === "login";

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[var(--tf-purple)] via-[var(--tf-purple-dark)] to-[var(--tf-purple)] p-8 text-white shadow-[var(--tf-shadow-card)]">
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[var(--tf-orange)]/20 blur-2xl" />

      <div className="relative z-10">
        <div className="mb-4 inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-widest text-white/90">
          Threefrogs Access
        </div>

        <h2 className="text-3xl font-black leading-tight md:text-4xl">
          {isLogin
            ? "Masuk dan lanjutkan sesi mainmu"
            : "Buat akun dan mulai booking dengan mudah"}
        </h2>

        <p className="mt-4 max-w-md text-sm leading-7 text-white/85">
          {isLogin
            ? "Login dengan nomor HP atau email supaya booking kamu tersimpan rapi, mudah dicek lagi, dan payment flow tetap jelas."
            : "Daftar sekali saja, lalu selanjutnya booking jadi jauh lebih ringkas karena data pemesan akan otomatis diambil dari akunmu."}
        </p>

        <div className="mt-8 grid gap-4">
          <div className="rounded-[1.5rem] bg-white/10 p-5 backdrop-blur">
            <p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange)]">
              01
            </p>
            <p className="mt-2 text-base font-semibold">
              Pilih tanggal, meja, dan slot tanpa ribet isi data berulang
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-white/10 p-5 backdrop-blur">
            <p className="text-sm font-black uppercase tracking-widest text-[var(--tf-green)]">
              02
            </p>
            <p className="mt-2 text-base font-semibold">
              Booking tersimpan ke akun dan bisa dicek lagi di Booking Saya
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-white/10 p-5 backdrop-blur">
            <p className="text-sm font-black uppercase tracking-widest text-white/80">
              03
            </p>
            <p className="mt-2 text-base font-semibold">
              Upload bukti bayar, upload ulang kalau perlu, lalu tunggu konfirmasi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}