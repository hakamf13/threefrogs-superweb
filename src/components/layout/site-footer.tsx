import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-3">
        <div>
          <p className="text-3xl font-black text-[var(--tf-purple)]">Threefrogs</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">
            Tempat reservasi mahjong dan boardgame dengan suasana seru, playful,
            dan nyaman untuk main bareng teman, keluarga, dan komunitas.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-[var(--tf-purple-dark)]">
            Navigasi
          </h3>
          <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
            <Link href="/" className="hover:text-[var(--tf-purple)]">
              Beranda
            </Link>
            <Link href="/stores" className="hover:text-[var(--tf-purple)]">
              Store
            </Link>
            <Link href="/reserve" className="hover:text-[var(--tf-purple)]">
              Reservasi
            </Link>
            <Link href="/my-bookings" className="hover:text-[var(--tf-purple)]">
              Booking Saya
            </Link>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-[var(--tf-purple-dark)]">
            Kontak
          </h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>WhatsApp: 08xxxxxxxxxx</p>
            <p>Instagram: @threefrogs.id</p>
            <p>Surabaya, Indonesia</p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 px-6 py-4 text-center text-xs text-slate-500">
        © 2026 Threefrogs. Joyful reservations for playful people.
      </div>
    </footer>
  );
}