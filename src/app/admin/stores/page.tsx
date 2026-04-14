import Link from "next/link";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminStoresPage() {
  const stores = await prisma.store.findMany({
    where: {
      category: "MAHJONG",
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      isActive: true,
      openHour: true,
      closeHour: true,
      coverImageUrl: true,
      tables: {
        where: {
          isActive: true,
        },
        select: {
          id: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-[var(--tf-bg)] px-4 py-12 text-slate-800 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
              Store Management
            </p>
            <h1 className="mt-3 text-4xl font-black text-[var(--tf-purple)]">
              Kelola Store
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Atur informasi store, cover image, jam operasional, dan data meja
              aktif untuk operasional admin.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-700"
          >
            Dashboard
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {stores.map((store) => (
            <Link
              key={store.id}
              href={`/admin/stores/${store.id}`}
              className="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)] transition hover:-translate-y-[1px] hover:border-[var(--tf-purple)]"
            >
              {store.coverImageUrl ? (
                <img
                  src={store.coverImageUrl}
                  alt={store.name}
                  className="mb-5 h-48 w-full rounded-[1.5rem] object-cover"
                />
              ) : (
                <div className="mb-5 h-48 rounded-[1.5rem] bg-gradient-to-br from-[var(--tf-lavender)] to-[var(--tf-cream)]" />
              )}

              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-[var(--tf-purple)]">
                    {store.name}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {store.city || "Surabaya"}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    store.isActive
                      ? "bg-green-50 text-green-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {store.isActive ? "Aktif" : "Nonaktif"}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-[var(--tf-lavender)] px-3 py-1 text-xs font-semibold text-[var(--tf-purple-dark)]">
                  {store.tables.length} meja aktif
                </span>
                <span className="rounded-full bg-[var(--tf-cream)] px-3 py-1 text-xs font-semibold text-[var(--tf-orange-dark)]">
                  {String(store.openHour).padStart(2, "0")}:00 -{" "}
                  {String(store.closeHour).padStart(2, "0")}:00
                </span>
              </div>

              <p className="mt-5 text-sm font-semibold text-slate-700 group-hover:text-[var(--tf-purple)]">
                Buka detail store →
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}