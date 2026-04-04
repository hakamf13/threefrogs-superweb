import Link from "next/link";
import { prisma } from "../../lib/prisma";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const stores = await prisma.store.findMany({
    where: {
      isActive: true,
      category: "MAHJONG",
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 4,
    include: {
      tables: {
        where: {
          isActive: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-[var(--tf-bg)] text-slate-800">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden bg-gradient-to-b from-[var(--tf-lavender)] via-[var(--tf-bg)] to-[var(--tf-bg)]">
          <div className="absolute left-[-60px] top-20 h-44 w-44 rounded-full bg-[var(--tf-orange)]/20 blur-3xl" />
          <div className="absolute right-[-60px] top-10 h-52 w-52 rounded-full bg-[var(--tf-purple)]/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-[var(--tf-green)]/20 blur-3xl" />

          <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
            <div className="mb-6 inline-flex rounded-full border border-[var(--tf-orange)]/30 bg-[var(--tf-cream)] px-4 py-2 text-sm font-bold text-[var(--tf-orange-dark)]">
              🐸 Joyful Space • Mahjong First • Reservation Ready
            </div>

            <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <h1 className="text-5xl font-black leading-tight tracking-tight text-[var(--tf-purple-dark)] md:text-6xl">
                  Tempat Main yang
                  <span className="block text-[var(--tf-orange)]">Seru, Lucu, dan Rapi</span>
                </h1>

                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                  Threefrogs adalah rumah main untuk mahjong, boardgame, dan
                  momen seru bareng teman. Pilih store, cek slot meja, reservasi
                  dengan mudah, lalu datang dan nikmati waktu mainmu.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/reserve"
                    className="rounded-2xl bg-[var(--tf-purple)] px-6 py-4 text-base font-bold text-white transition hover:bg-[var(--tf-purple-dark)]"
                  >
                    Reserve Now
                  </Link>

                  <Link
                    href="/stores"
                    className="rounded-2xl border border-[var(--tf-purple)] px-6 py-4 text-base font-bold text-[var(--tf-purple)] transition hover:bg-[var(--tf-lavender)]"
                  >
                    Lihat Store
                  </Link>
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[var(--tf-shadow-card)]">
                    <p className="text-sm text-slate-500">Harga Mulai</p>
                    <p className="mt-2 text-2xl font-black text-[var(--tf-purple)]">
                      Rp 45.000
                    </p>
                    <p className="text-sm text-slate-500">per jam / meja</p>
                  </div>

                  <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[var(--tf-shadow-card)]">
                    <p className="text-sm text-slate-500">Jam Main</p>
                    <p className="mt-2 text-2xl font-black text-[var(--tf-purple)]">
                      11.00–22.00
                    </p>
                    <p className="text-sm text-slate-500">setiap hari</p>
                  </div>

                  <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[var(--tf-shadow-card)]">
                    <p className="text-sm text-slate-500">Booking Window</p>
                    <p className="mt-2 text-2xl font-black text-[var(--tf-purple)]">
                      1 Bulan
                    </p>
                    <p className="text-sm text-slate-500">ke depan</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5">
                <div className="rounded-[2.25rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
                  <div className="rounded-[1.75rem] bg-gradient-to-br from-[var(--tf-purple)] to-[var(--tf-purple-dark)] p-6 text-white">
                    <p className="text-sm font-semibold uppercase tracking-widest text-white/80">
                      Main Flow
                    </p>
                    <h3 className="mt-3 text-2xl font-black">Book • Pay • Play</h3>
                    <p className="mt-3 text-sm leading-6 text-white/85">
                      Flow reservasi dibuat sesingkat mungkin, supaya customer
                      cepat paham dan admin tetap nyaman mengelola booking.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[var(--tf-shadow-card)]">
                    <div className="rounded-[1.5rem] bg-[var(--tf-cream)] p-4">
                      <p className="text-sm font-bold text-[var(--tf-orange-dark)]">
                        Boardgame
                      </p>
                      <p className="mt-2 text-xl font-black text-[var(--tf-purple)]">
                        Coming Soon
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[var(--tf-shadow-card)]">
                    <div className="rounded-[1.5rem] bg-[#eef9d8] p-4">
                      <p className="text-sm font-bold text-[var(--tf-green-dark)]">
                        Events & Party
                      </p>
                      <p className="mt-2 text-xl font-black text-[var(--tf-purple)]">
                        On Progress
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[var(--tf-shadow-card)]">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-[1.25rem] bg-[var(--tf-lavender)] p-4">
                      <p className="text-sm font-bold text-[var(--tf-purple-dark)]">
                        01
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        Pilih tanggal & meja
                      </p>
                    </div>

                    <div className="rounded-[1.25rem] bg-[var(--tf-cream)] p-4">
                      <p className="text-sm font-bold text-[var(--tf-orange-dark)]">
                        02
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        Booking tersimpan
                      </p>
                    </div>

                    <div className="rounded-[1.25rem] bg-[#eef9d8] p-4">
                      <p className="text-sm font-bold text-[var(--tf-green-dark)]">
                        03
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        Upload / confirm
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-8 text-center md:text-left">
            <p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
              Announcement
            </p>
            <h2 className="mt-3 text-3xl font-black text-[var(--tf-purple)] md:text-4xl">
              Update terbaru dari Threefrogs
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
              <div className="mb-4 inline-flex rounded-full bg-[var(--tf-lavender)] px-3 py-1 text-xs font-bold text-[var(--tf-purple-dark)]">
                LIVE NOW
              </div>
              <h3 className="text-xl font-black text-[var(--tf-purple)]">
                Reservasi Mahjong Sudah Aktif
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Customer sudah bisa login, pilih slot, booking, upload bukti, dan
                lihat riwayat booking sendiri.
              </p>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
              <div className="mb-4 inline-flex rounded-full bg-[var(--tf-cream)] px-3 py-1 text-xs font-bold text-[var(--tf-orange-dark)]">
                NEXT
              </div>
              <h3 className="text-xl font-black text-[var(--tf-purple)]">
                Boardgame Flow Menyusul
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Katalog boardgame, filter game, dan flow reservasi boardgame akan
                dibuka di tahap pengembangan berikutnya.
              </p>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
              <div className="mb-4 inline-flex rounded-full bg-[#eef9d8] px-3 py-1 text-xs font-bold text-[var(--tf-green-dark)]">
                STORE
              </div>
              <h3 className="text-xl font-black text-[var(--tf-purple)]">
                Manual Booking untuk Walk-in
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Admin sekarang bisa input manual booking, direct confirm, dan cek
                availability secara visual untuk operasional toko.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
                  Store Highlights
                </p>
                <h2 className="mt-3 text-3xl font-black text-[var(--tf-purple)] md:text-4xl">
                  Main di store Threefrogs favoritmu
                </h2>
              </div>

              <Link
                href="/stores"
                className="font-semibold text-[var(--tf-purple)] hover:underline"
              >
                Lihat semua store
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {stores.map((store, index) => (
                <div
                  key={store.id}
                  className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]"
                >
                  <div
                    className={`mb-5 h-36 rounded-[1.5rem] ${
                      index % 3 === 0
                        ? "bg-gradient-to-br from-[var(--tf-lavender)] to-[var(--tf-cream)]"
                        : index % 3 === 1
                        ? "bg-gradient-to-br from-[#fff0d8] to-[#f4ebff]"
                        : "bg-gradient-to-br from-[#eef9d8] to-[#f4ebff]"
                    }`}
                  />

                  <h3 className="text-xl font-black text-[var(--tf-purple)]">
                    {store.name}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {store.description ||
                      "Store Threefrogs yang siap untuk reservasi mahjong."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[var(--tf-lavender)] px-3 py-1 text-xs font-semibold text-[var(--tf-purple-dark)]">
                      {store.tables.length} meja aktif
                    </span>
                    <span className="rounded-full bg-[var(--tf-cream)] px-3 py-1 text-xs font-semibold text-[var(--tf-orange-dark)]">
                      Surabaya
                    </span>
                  </div>

                  <Link
                    href="/reserve"
                    className="mt-5 inline-flex rounded-2xl bg-[var(--tf-purple)] px-4 py-2 font-semibold text-white transition hover:bg-[var(--tf-purple-dark)]"
                  >
                    Reservasi di sini
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-8 text-center md:text-left">
            <p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
              Why Threefrogs
            </p>
            <h2 className="mt-3 text-3xl font-black text-[var(--tf-purple)] md:text-4xl">
              Kenapa booking di sini terasa lebih enak
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
              <p className="text-sm font-black text-[var(--tf-orange-dark)]">01</p>
              <h3 className="mt-3 text-xl font-black text-[var(--tf-purple)]">
                Slot jelas & realtime
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Customer bisa langsung lihat meja dan jam yang tersedia tanpa
                tebak-tebakan.
              </p>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
              <p className="text-sm font-black text-[var(--tf-orange-dark)]">02</p>
              <h3 className="mt-3 text-xl font-black text-[var(--tf-purple)]">
                Booking tersimpan ke akun
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Riwayat booking, status pembayaran, dan detail meja bisa dicek
                lagi kapan saja.
              </p>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
              <p className="text-sm font-black text-[var(--tf-orange-dark)]">03</p>
              <h3 className="mt-3 text-xl font-black text-[var(--tf-purple)]">
                Fleksibel untuk operasional
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Ada upload proof, upload ulang, direct confirm admin, manual
                booking, dan expiry otomatis.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2.25rem] border border-slate-200 bg-white p-8 shadow-[var(--tf-shadow-card)]">
              <p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
                Quick Pricing
              </p>
              <h2 className="mt-3 text-3xl font-black text-[var(--tf-purple)]">
                Harga simpel, gampang dipahami
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] bg-[var(--tf-lavender)] p-5">
                  <p className="text-sm text-slate-500">Mahjong</p>
                  <p className="mt-2 text-3xl font-black text-[var(--tf-purple)]">
                    Rp 45.000
                  </p>
                  <p className="text-sm text-slate-600">per jam / meja</p>
                </div>

                <div className="rounded-[1.5rem] bg-[var(--tf-cream)] p-5">
                  <p className="text-sm text-slate-500">Flow Pembayaran</p>
                  <p className="mt-2 text-xl font-black text-[var(--tf-purple)]">
                    Upload atau Confirm
                  </p>
                  <p className="text-sm text-slate-600">
                    bisa via proof atau admin
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2.25rem] bg-[var(--tf-purple)] px-8 py-10 text-white shadow-[var(--tf-shadow-card)]">
              <p className="text-sm font-black uppercase tracking-widest text-white/75">
                Ready to play?
              </p>
              <h2 className="mt-3 text-3xl font-black md:text-4xl">
                Yuk amankan slot mainmu sekarang
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/85">
                Reservasi lebih awal supaya meja dan jam favoritmu tidak keburu
                diambil orang lain.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/reserve"
                  className="rounded-2xl bg-white px-5 py-3 font-bold text-[var(--tf-purple)]"
                >
                  Mulai Reservasi
                </Link>
                <Link
                  href="/my-bookings"
                  className="rounded-2xl border border-white/40 px-5 py-3 font-bold text-white"
                >
                  Booking Saya
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}