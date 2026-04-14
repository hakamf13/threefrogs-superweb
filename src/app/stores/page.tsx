import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import { prisma } from "../../lib/prisma";
import EmptyStateCard from "@/components/ui/empty-state-card";
import { getStoreOperatingHoursSummary } from "@/lib/store-hours";

export default async function StoresPage() {
  const stores = await prisma.store.findMany({
    where: {
      isActive: true,
      category: "MAHJONG",
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
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
      },
    },
  });

  return (
    <div className="min-h-screen bg-[var(--tf-bg)] text-slate-800">
      <SiteHeader />

      <main className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-[1140px]">
          <div className="mb-12 text-center md:text-left">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
              Store directory
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-[var(--tf-purple)] md:text-6xl">
              Pilih store Threefrogs favoritmu
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Setiap store punya karakter dan kapasitas meja yang berbeda.
              Begitu kamu klik tombol reservasi, store pilihanmu akan langsung
              terbawa ke halaman booking.
            </p>
          </div>

          {stores.length === 0 ? (
            <EmptyStateCard
              eyebrow="Stores"
              title="Store belum tersedia"
              description="Store Threefrogs belum muncul di sistem. Nanti begitu store aktif, daftarnya akan tampil di sini."
              actionHref="/"
              actionLabel="Kembali ke beranda"
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {stores.map((store, index) => (
                <div
                  key={store.id}
                  className="rounded-[1.75rem] border border-[var(--tf-border)] bg-white p-6 shadow-[var(--tf-shadow-card)]"
                >
                  {store.coverImageUrl ? (
                    <div className="relative mb-5 h-56 overflow-hidden rounded-[1.4rem]">
                      <Image
                        src={store.coverImageUrl}
                        alt={store.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  ) : (
                    <div
                      className={`mb-5 h-56 rounded-[1.4rem] ${
                        index % 3 === 0
                          ? "bg-gradient-to-br from-[var(--tf-lavender)] to-[var(--tf-cream)]"
                          : index % 3 === 1
                          ? "bg-gradient-to-br from-[#FFF0D8] to-[#F4EBFF]"
                          : "bg-gradient-to-br from-[#EEF9D8] to-[#F4EBFF]"
                      }`}
                    />
                  )}

                  <h2 className="text-3xl font-black tracking-tight text-[var(--tf-purple)]">
                    {store.name}
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {store.description ||
                      "Store Threefrogs yang siap dipakai untuk reservasi mahjong dan sesi bermain seru."}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[var(--tf-lavender)] px-3 py-1 text-xs font-bold text-[var(--tf-purple-dark)]">
                      {store.tables.length} meja aktif
                    </span>
                    <span className="rounded-full bg-[var(--tf-cream)] px-3 py-1 text-xs font-bold text-[var(--tf-orange-dark)]">
                      {store.city || "Surabaya"}
                    </span>
                  </div>

                  <div className="mt-5 space-y-2 text-sm leading-7 text-slate-600">
                    <p>Alamat: {store.address || "-"}</p>
                    <p>Jam operasional: {getStoreOperatingHoursSummary(store)}</p>
                  </div>

                  <Link
                    href={{
                      pathname: "/reserve",
                      query: { store: store.id },
                    }}
                    className="mt-6 inline-flex rounded-2xl bg-[var(--tf-purple)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--tf-purple-dark)]"
                  >
                    Reservasi di sini
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}