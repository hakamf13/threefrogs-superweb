import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import { prisma } from "../../../lib/prisma";

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

      <main className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center md:text-left">
            <p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
              Store Directory
            </p>
            <h1 className="mt-3 text-4xl font-black text-[var(--tf-purple)] md:text-5xl">
              Pilih store Threefrogs favoritmu
            </h1>
            <p className="mt-4 max-w-2xl text-slate-600">
              Setiap store punya karakter dan kapasitas meja yang berbeda. Pilih
              lokasi yang paling cocok buat sesi mainmu.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {stores.map((store, index) => (
              <div
                key={store.id}
                className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]"
              >
                <div
                  className={`mb-5 h-44 rounded-[1.5rem] ${
                    index % 3 === 0
                      ? "bg-gradient-to-br from-[var(--tf-lavender)] to-[var(--tf-cream)]"
                      : index % 3 === 1
                      ? "bg-gradient-to-br from-[#fff0d8] to-[#f4ebff]"
                      : "bg-gradient-to-br from-[#eef9d8] to-[#f4ebff]"
                  }`}
                />

                <h2 className="text-2xl font-black text-[var(--tf-purple)]">
                  {store.name}
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {store.description || "Store Threefrogs yang siap dipakai untuk reservasi mahjong dan sesi bermain seru."}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[var(--tf-lavender)] px-3 py-1 text-xs font-semibold text-[var(--tf-purple-dark)]">
                    {store.tables.length} meja aktif
                  </span>
                  <span className="rounded-full bg-[var(--tf-cream)] px-3 py-1 text-xs font-semibold text-[var(--tf-orange-dark)]">
                    {store.city || "Surabaya"}
                  </span>
                </div>

                <div className="mt-5 space-y-2 text-sm text-slate-600">
                  <p>Alamat: {store.address || "-"}</p>
                  <p>Jam Operasional: 11.00 - 22.00</p>
                </div>

                <a
                  href="/reserve"
                  className="mt-6 inline-flex rounded-2xl bg-[var(--tf-purple)] px-5 py-3 font-bold text-white transition hover:bg-[var(--tf-purple-dark)]"
                >
                  Reservasi di sini
                </a>
              </div>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}