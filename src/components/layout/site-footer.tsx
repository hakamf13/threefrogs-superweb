import Image from "next/image";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/site-config";

export default function SiteFooter() {
  return (
    <footer className="mt-14 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-[1140px] px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-[1.1fr_0.7fr_0.85fr]">
          <div>
            <Image
              src="/logo-3frogs.png"
              alt="Threefrogs Mahjong & Boardgame"
              width={220}
              height={72}
              className="h-12 w-auto object-contain sm:h-14"
            />

            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
              Tempat reservasi mahjong dan boardgame dengan suasana seru,
              nyaman, dan rapi untuk main bareng teman, keluarga, dan komunitas.
            </p>

            <div className="mt-5 flex gap-3">
              <a
                href={SITE_CONFIG.instagram.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-[var(--tf-lavender)] px-4 text-sm font-semibold text-[var(--tf-purple)] transition hover:bg-[#e9dcff]"
              >
                IG
              </a>
              <a
                href={SITE_CONFIG.whatsapp.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-[var(--tf-lavender)] px-4 text-sm font-semibold text-[var(--tf-purple)] transition hover:bg-[#e9dcff]"
              >
                WA
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--tf-purple-dark)]">
              Menu utama
            </h3>

            <div className="mt-4 flex flex-col gap-2.5 text-sm text-slate-600">
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
            <div className="rounded-[1.35rem] border border-[var(--tf-border)] bg-[var(--tf-surface-muted)] p-4 sm:p-5">
              <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--tf-purple-dark)]">
                Kontak
              </h3>

              <div className="mt-3 space-y-2.5 text-sm leading-6 text-slate-600">
                <p>
                  WhatsApp:{" "}
                  <a
                    href={SITE_CONFIG.whatsapp.href}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[var(--tf-purple)] hover:underline"
                  >
                    {SITE_CONFIG.whatsapp.label}
                  </a>
                </p>
                <p>
                  Instagram:{" "}
                  <a
                    href={SITE_CONFIG.instagram.href}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[var(--tf-purple)] hover:underline"
                  >
                    @{SITE_CONFIG.instagram.label}
                  </a>
                </p>
                <p>{SITE_CONFIG.location}</p>
                <p>Jam operasional mengikuti cabang yang dipilih.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-7 border-t border-slate-200 pt-4 text-center text-xs leading-6 text-slate-500">
          © 2026 Threefrogs. Reservasi yang lebih rapi untuk pengalaman main yang lebih nyaman.
        </div>
      </div>
    </footer>
  );
}