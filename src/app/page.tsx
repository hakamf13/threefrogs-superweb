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
    <div className="min-h-screen bg-[#F8F4FF] text-slate-800">
      <SiteHeader />

      <main>
        <section className="border-b border-slate-200 bg-gradient-to-b from-[#FFF8C9] via-[#F8F4FF] to-[#F8F4FF]">
          <div className="mx-auto max-w-6xl px-6 py-6">
            <div className="inline-flex rounded-full border border-yellow-300 bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-800">
              Announcement • Reservasi mahjong sudah live • Boardgame & event flow coming soon
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
            <div className="flex flex-col justify-center">
              <div className="mb-4 inline-flex w-fit rounded-full bg-[#EDE7FF] px-4 py-2 text-sm font-bold text-[#5D3FD3]">
                Roll the dice, reserve your fun!
              </div>

              <h1 className="text-5xl font-black leading-tight tracking-tight text-[#5D3FD3] md:text-6xl">
                Reservasi Mahjong yang Seru, Rapi, dan Siap Dipakai
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Pilih store, lihat slot jam, booking meja favoritmu, lalu upload
                bukti pembayaran atau langsung dikonfirmasi admin untuk kebutuhan
                walk-in dan operasional harian.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/reserve"
                  className="rounded-2xl bg-[#5D3FD3] px-6 py-4 text-base font-bold text-white shadow-sm transition hover:translate-y-[-1px]"
                >
                  Reserve Now
                </Link>

                <Link
                  href="/stores"
                  className="rounded-2xl border border-[#5D3FD3] px-6 py-4 text-base font-bold text-[#5D3FD3] transition hover:bg-[#F3EEFF]"
                >
                  Explore Stores
                </Link>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <p className="text-sm text-slate-500">Harga Mulai</p>
                  <p className="mt-1 text-2xl font-black text-[#5D3FD3]">
                    Rp 45.000
                  </p>
                  <p className="text-sm text-slate-500">per jam / meja</p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <p className="text-sm text-slate-500">Jam Operasional</p>
                  <p className="mt-1 text-2xl font-black text-[#5D3FD3]">
                    11.00–22.00
                  </p>
                  <p className="text-sm text-slate-500">setiap hari</p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <p className="text-sm text-slate-500">Booking Window</p>
                  <p className="mt-1 text-2xl font-black text-[#5D3FD3]">
                    1 Bulan
                  </p>
                  <p className="text-sm text-slate-500">ke depan</p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
              <div className="rounded-[28px] bg-white p-6 shadow-sm">
                <div className="rounded-3xl bg-[#EDE7FF] p-5">
                  <p className="text-sm font-semibold text-[#5D3FD3]">
                    Quick Reserve
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-[#5D3FD3]">
                    Mahjong First
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Fokus utama sekarang ada di flow reservasi mahjong yang cepat,
                    jelas, dan aman untuk customer maupun admin.
                  </p>
                </div>
              </div>

              <div className="rounded-[28px] bg-white p-6 shadow-sm">
                <div className="rounded-3xl bg-[#FFF3CC] p-5">
                  <p className="text-sm font-semibold text-yellow-800">
                    Events & Parties
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-yellow-800">
                    Coming Soon
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Birthday party, event gathering, dan boardgame reservation
                    akan menyusul dengan flow yang lebih lengkap.
                  </p>
                </div>
              </div>

              <div className="rounded-[28px] bg-white p-6 shadow-sm sm:col-span-2">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-3xl bg-[#F8F4FF] p-5">
                    <p className="text-sm font-semibold text-slate-500">
                      Langkah 1
                    </p>
                    <p className="mt-2 text-lg font-bold text-[#5D3FD3]">
                      Login & Pilih Slot
                    </p>
                  </div>

                  <div className="rounded-3xl bg-[#F8F4FF] p-5">
                    <p className="text-sm font-semibold text-slate-500">
                      Langkah 2
                    </p>
                    <p className="mt-2 text-lg font-bold text-[#5D3FD3]">
                      Booking Tersimpan
                    </p>
                  </div>

                  <div className="rounded-3xl bg-[#F8F4FF] p-5">
                    <p className="text-sm font-semibold text-slate-500">
                      Langkah 3
                    </p>
                    <p className="mt-2 text-lg font-bold text-[#5D3FD3]">
                      Upload / Konfirmasi
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Store Highlights
              </p>
              <h2 className="text-3xl font-black text-[#5D3FD3]">
                Main di store Threefrogs favoritmu
              </h2>
            </div>

            <Link
              href="/stores"
              className="font-semibold text-[#5D3FD3] hover:underline"
            >
              Lihat semua store
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {stores.map((store) => (
              <div
                key={store.id}
                className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 h-36 rounded-3xl bg-gradient-to-br from-[#EDE7FF] to-[#FFF3CC]" />

                <h3 className="text-xl font-black text-[#5D3FD3]">
                  {store.name}
                </h3>

                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                  {store.description || "Store Threefrogs yang siap untuk reservasi mahjong."}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {store.tables.length} meja aktif
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    Surabaya
                  </span>
                </div>

                <Link
                  href="/reserve"
                  className="mt-5 inline-flex rounded-2xl border border-[#5D3FD3] px-4 py-2 font-semibold text-[#5D3FD3]"
                >
                  Reservasi di sini
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Your Flow
              </p>
              <h2 className="text-3xl font-black text-[#5D3FD3]">
                Dibuat supaya customer tidak bingung
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-[28px] border border-slate-200 bg-[#F8F4FF] p-6">
                <p className="text-sm font-semibold text-slate-500">01</p>
                <h3 className="mt-3 text-xl font-black text-[#5D3FD3]">
                  Pilih tanggal & meja
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Slot yang terisi langsung terlihat, jadi customer tidak perlu
                  tebak-tebakan lagi.
                </p>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-[#F8F4FF] p-6">
                <p className="text-sm font-semibold text-slate-500">02</p>
                <h3 className="mt-3 text-xl font-black text-[#5D3FD3]">
                  Booking tercatat rapi
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Semua booking tersimpan ke akun user, mudah dicek lagi di
                  halaman Booking Saya.
                </p>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-[#F8F4FF] p-6">
                <p className="text-sm font-semibold text-slate-500">03</p>
                <h3 className="mt-3 text-xl font-black text-[#5D3FD3]">
                  Payment flow fleksibel
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Bisa upload bukti, upload ulang kalau salah, atau langsung
                  dikonfirmasi admin untuk kebutuhan operasional.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="rounded-[36px] bg-[#5D3FD3] px-8 py-10 text-white shadow-sm">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-white/80">
                  Ready to play?
                </p>
                <h2 className="mt-3 text-3xl font-black md:text-4xl">
                  Yuk amankan slot mainmu sekarang
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/85">
                  Reservasi lebih awal supaya meja dan jam favoritmu tidak keburu
                  diambil orang lain.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Link
                  href="/reserve"
                  className="rounded-2xl bg-white px-5 py-3 font-bold text-[#5D3FD3]"
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