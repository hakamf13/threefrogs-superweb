import Image from "next/image";
import Link from "next/link";
import { prisma } from "../lib/prisma";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import { getStoreOperatingHoursSummary } from "@/lib/store-hours";
import HeroStoreCarouselLazy from "@/components/home/hero-store-carousel-lazy";

export const dynamic = "force-dynamic";

// const HeroStoreCarousel = dynamic(
//   () => import("@/components/home/hero-store-carousel"),
//   {
//     ssr: false,
//     loading: () => (
//       <div className="h-[420px] w-full max-w-[420px] rounded-[1.75rem] border border-white/10 bg-white/10" />
//     ),
//   }
// );

const GAME_TEASERS = [
  {
    title: "Party Games",
    description: "Pilihan game ringan dan seru untuk mencairkan suasana bareng teman.",
    accent: "bg-[var(--tf-cream)] text-[var(--tf-orange-dark)]",
  },
  {
    title: "Strategy Games",
    description: "Cocok untuk pemain yang suka mikir, planning, dan adu taktik.",
    accent: "bg-[var(--tf-lavender)] text-[var(--tf-purple-dark)]",
  },
  {
    title: "Mahjong Session",
    description: "Reservasi mahjong jadi fokus utama, dengan alur yang cepat dan jelas.",
    accent: "bg-[#EEF9D8] text-[var(--tf-green-dark)]",
  },
];

const SNACK_TEASERS = [
  "Snack ringan untuk menemani sesi main",
  "Pilihan minuman dingin dan hangat",
  "Pilihan praktis untuk sesi yang lebih panjang",
];

const FAQS = [
  {
    question: "Apakah harus login dulu untuk booking?",
    answer:
      "Iya. Customer perlu login dulu supaya booking tersimpan ke akun dan bisa dicek lagi di halaman Booking Saya.",
  },
  {
    question: "Berapa lama slot ditahan kalau belum bayar?",
    answer:
      "Booking akan ditahan sementara sambil menunggu pembayaran. Kalau lewat batas waktu, booking akan otomatis kedaluwarsa.",
  },
  {
    question: "Kalau salah upload bukti bayar bagaimana?",
    answer:
      "Tenang, bukti pembayaran bisa diunggah ulang selama booking masih dalam status yang mengizinkan.",
  },
  {
    question: "Apakah admin bisa bantu booking walk-in?",
    answer:
      "Bisa. Admin punya alur manual booking dan direct confirm untuk kebutuhan operasional di store.",
  },
];

export default async function HomePage() {
  const [stores, activeStoresCount] = await Promise.all([
    prisma.store.findMany({
      where: {
        isActive: true,
        category: "MAHJONG",
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 4,
      select: {
        id: true,
        name: true,
        description: true,
        city: true,
        coverImageUrl: true,
        operatingHours: {
          select: {
            dayOfWeek: true,
            openHour: true,
            closeHour: true,
            isClosed: true,
          },
        },
        tables: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
          },
        },
      },
    }),
    prisma.store.count({
      where: {
        isActive: true,
        category: "MAHJONG",
      },
    }),
  ]);

  const stats = [
    { label: "Lokasi aktif", value: `${activeStoresCount} lokasi` },
    { label: "Koleksi game", value: "100+ judul" },
    { label: "Tipe meja", value: "Auto table" },
    { label: "Komunitas", value: "500+ member" },
  ];

  return (
    <div id="page-top" className="min-h-screen bg-[var(--tf-bg)] text-slate-800">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#6F2DBD_0%,#5D3FD3_55%,#6A35D4_100%)]" />
          <div className="absolute left-[-80px] top-12 hidden h-56 w-56 rounded-full bg-white/10 blur-3xl md:block" />
          <div className="absolute right-[-80px] top-20 hidden h-72 w-72 rounded-full bg-[#FFD23F]/10 blur-3xl md:block" />

          <div className="relative mx-auto max-w-[1140px] px-4 py-16 sm:px-6 lg:py-20">
            <div className="grid gap-10 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
              <div className="text-white">
                <p className="inline-flex rounded-full border border-white/18 bg-white/10 px-4 py-2 text-sm font-medium text-white/92">
                  Jam operasional menyesuaikan cabang
                </p>

                <h1 className="mt-8 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight md:text-6xl">
                  Reservasi yang lebih rapi
                  <span className="mt-2 block text-[#FFD23F]">
                    untuk waktu main yang lebih seru.
                  </span>
                </h1>

                <p className="mt-6 max-w-3xl text-lg leading-9 text-white/84">
                  Threefrogs memudahkan kamu memilih store, mengecek ketersediaan
                  meja, dan mengamankan slot main dengan alur yang simpel,
                  cepat, dan nyaman dipakai.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/reserve"
                    className="inline-flex items-center rounded-[1.5rem] bg-[#FFD23F] px-7 py-3.5 text-base font-semibold text-[var(--tf-purple-dark)] shadow-[0_6px_0_rgb(214,161,0)] transition hover:translate-y-[1px]"
                  >
                    Mulai reservasi
                  </Link>

                  <Link
                    href="/stores"
                    className="inline-flex items-center rounded-[1.5rem] border border-white/20 bg-white/10 px-7 py-3.5 text-base font-semibold text-white transition hover:bg-white/14"
                  >
                    Lihat store
                  </Link>
                </div>
              </div>

              <div className="hidden xl:flex xl:justify-end">
                <HeroStoreCarouselLazy
                  stores={stores.map((store) => ({
                    id: store.id,
                    name: store.name,
                    description: store.description,
                    city: store.city,
                    coverImageUrl: store.coverImageUrl,
                  }))}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 mt-0 px-4 pb-16 sm:px-6 md:-mt-4 xl:-mt-8">
          <div className="mx-auto grid max-w-[1140px] gap-6 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => (
              <div
                key={item.label}
                className="rounded-[1.75rem] border border-[var(--tf-border)] bg-white p-7 text-center shadow-[var(--tf-shadow-card)]"
              >
                <div className="mx-auto h-3 w-3 rounded-full bg-[var(--tf-purple)]" />
                <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  {item.label}
                </p>
                <p className="mt-3 text-3xl font-black tracking-tight text-[#10284D]">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1140px] px-4 py-10 sm:px-6">
          <div className="mb-10 text-center md:text-left">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
              Store showcase
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-[var(--tf-purple)] md:text-5xl">
              Vibes tempat mainmu ada di sini
            </h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Pilih store favoritmu dan langsung lanjut ke reservasi tanpa
              memilih ulang.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {stores.map((store, index) => (
              <div
                key={store.id}
                className="rounded-[1.75rem] border border-[var(--tf-border)] bg-white p-5 shadow-[var(--tf-shadow-card)]"
              >
                {store.coverImageUrl ? (
                  <div className="relative mb-4 h-56 overflow-hidden rounded-[1.4rem]">
                    <Image
                      src={store.coverImageUrl}
                      alt={store.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    />
                  </div>
                ) : (
                  <div
                    className={`mb-4 h-56 rounded-[1.4rem] ${
                      index % 4 === 0
                        ? "bg-gradient-to-br from-[var(--tf-lavender)] to-[var(--tf-cream)]"
                        : index % 4 === 1
                        ? "bg-gradient-to-br from-[#FFF0D8] to-[#F4EBFF]"
                        : index % 4 === 2
                        ? "bg-gradient-to-br from-[#EEF9D8] to-[#F8F2FF]"
                        : "bg-gradient-to-br from-[#FDE8FF] to-[#FFF8E7]"
                    }`}
                  />
                )}

                <h3 className="text-2xl font-black tracking-tight text-[var(--tf-purple)]">
                  {store.name}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {store.description ||
                    "Store Threefrogs yang siap dipakai untuk sesi bermain mahjong yang seru."}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[var(--tf-lavender)] px-3 py-1 text-xs font-bold text-[var(--tf-purple-dark)]">
                    {store.tables.length} meja aktif
                  </span>
                  <span className="rounded-full bg-[var(--tf-cream)] px-3 py-1 text-xs font-bold text-[var(--tf-orange-dark)]">
                    {store.city || "Surabaya"}
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Jam operasional
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {getStoreOperatingHoursSummary(store)}
                  </p>
                </div>

                <Link
                  href={{
                    pathname: "/reserve",
                    query: { store: store.id },
                  }}
                  className="mt-5 inline-flex rounded-2xl bg-[var(--tf-purple)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--tf-purple-dark)]"
                >
                  Reservasi di sini
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-[1140px] px-4 py-16 sm:px-6">
            <div className="mb-8">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
                Teaser
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-[var(--tf-purple)] md:text-5xl">
                Sedikit gambaran isi dunia Threefrogs
              </h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
                <h3 className="text-2xl font-black text-[var(--tf-purple)]">
                  Boardgame teaser
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Threefrogs juga menyiapkan pilihan boardgame untuk melengkapi
                  suasana bermain. Fokus utama saat ini tetap pada reservasi
                  mahjong yang rapi dan nyaman dipakai.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {GAME_TEASERS.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4"
                    >
                      <div
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${item.accent}`}
                      >
                        {item.title}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
                <h3 className="text-2xl font-black text-[var(--tf-purple)]">
                  Snack & drinks
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Selain reservasi, Threefrogs juga menyiapkan pilihan snack dan
                  minuman untuk menemani sesi bermain yang lebih nyaman.
                </p>

                <div className="mt-6 space-y-3">
                  {SNACK_TEASERS.map((item, index) => (
                    <div
                      key={item}
                      className={`rounded-[1.15rem] p-4 ${
                        index === 0
                          ? "bg-[var(--tf-cream)]"
                          : index === 1
                          ? "bg-[var(--tf-lavender)]"
                          : "bg-[#EEF9D8]"
                      }`}
                    >
                      <p className="font-semibold text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>

                <Link
                  href="/reserve"
                  className="mt-6 inline-flex rounded-2xl border border-[var(--tf-purple)] px-4 py-2 font-semibold text-[var(--tf-purple)] transition hover:bg-[var(--tf-lavender)]"
                >
                  Lanjut ke reservasi
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1140px] px-4 py-16 sm:px-6">
          <div className="mb-8 text-center md:text-left">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
              FAQ
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-[var(--tf-purple)] md:text-5xl">
              Pertanyaan yang paling sering ditanya
            </h2>
          </div>

          <div className="grid gap-4">
            {FAQS.map((faq) => (
              <div
                key={faq.question}
                className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]"
              >
                <h3 className="text-lg font-black text-[var(--tf-purple)]">
                  {faq.question}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1140px] px-4 pb-16 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-[var(--tf-shadow-card)]">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
                Quick pricing
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-[var(--tf-purple)]">
                Harga simpel, gampang dipahami
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.25rem] bg-[var(--tf-lavender)] p-5">
                  <p className="text-sm text-slate-500">Mahjong</p>
                  <p className="mt-2 text-3xl font-black text-[var(--tf-purple)]">
                    Rp 45.000
                  </p>
                  <p className="text-sm text-slate-600">per jam / meja</p>
                </div>

                <div className="rounded-[1.25rem] bg-[var(--tf-cream)] p-5">
                  <p className="text-sm text-slate-500">Pembayaran</p>
                  <p className="mt-2 text-xl font-black text-[var(--tf-purple)]">
                    Lebih mudah dipantau
                  </p>
                  <p className="text-sm text-slate-600">
                    jelas untuk customer maupun admin
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] bg-[linear-gradient(135deg,#6F2DBD_0%,#5D3FD3_55%,#6A35D4_100%)] px-8 py-10 text-white shadow-[var(--tf-shadow-card)]">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/75">
                Ready to play?
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
                Yuk amankan slot mainmu sekarang
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/85">
                Reservasi lebih awal supaya meja dan jam favoritmu tidak keburu
                diambil orang lain.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/reserve"
                  className="rounded-2xl bg-white px-5 py-3 font-semibold text-[var(--tf-purple)]"
                >
                  Mulai reservasi
                </Link>
                <Link
                  href="/my-bookings"
                  className="rounded-2xl border border-white/30 px-5 py-3 font-semibold text-white"
                >
                  Booking saya
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