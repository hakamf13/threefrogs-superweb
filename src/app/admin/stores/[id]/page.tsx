import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "../../../../lib/prisma";
import StoreSettingsForm from "./store-settings-form";
import TableSettingsManager from "./table-settings-manager";

export const dynamic = "force-dynamic";

type AdminStoreDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminStoreDetailPage({
  params,
}: AdminStoreDetailPageProps) {
  const { id } = await params;

  const store = await prisma.store.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      address: true,
      locationHint: true,
      description: true,
      openHour: true,
      closeHour: true,
      isActive: true,
      coverImageUrl: true,
      coverImagePublicId: true,
      operatingHours: {
        orderBy: {
          dayOfWeek: "asc",
        },
        select: {
          dayOfWeek: true,
          openHour: true,
          closeHour: true,
          isClosed: true,
        },
      },
      tables: {
        orderBy: {
          tableNumber: "asc",
        },
        select: {
          id: true,
          tableNumber: true,
          tableCode: true,
          displayLabel: true,
          capacity: true,
          note: true,
          isActive: true,
        },
      },
    },
  });

  if (!store) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[var(--tf-bg)] px-4 py-12 text-slate-800 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
              Store Management
            </p>
            <h1 className="mt-3 text-4xl font-black text-[var(--tf-purple)]">
              {store.name}
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Edit informasi store, jam operasional, status aktif, cover image,
              dan seluruh meja untuk store ini.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/stores"
              className="rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-700"
            >
              Kembali ke Stores
            </Link>
            <Link
              href="/admin"
              className="rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-700"
            >
              Dashboard
            </Link>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <StoreSettingsForm
            store={{
              id: store.id,
              name: store.name,
              slug: store.slug,
              city: store.city,
              address: store.address,
              locationHint: store.locationHint ?? null,
              description: store.description,
              openHour: store.openHour ?? 11,
              closeHour: store.closeHour ?? 22,
              isActive: store.isActive,
              coverImageUrl: store.coverImageUrl,
              coverImagePublicId: store.coverImagePublicId,
              operatingHours: store.operatingHours,
            }}
          />

          <TableSettingsManager
            storeId={store.id}
            storeName={store.name}
            tables={store.tables.map((table) => ({
              id: table.id,
              tableNumber: table.tableNumber,
              tableCode: table.tableCode,
              displayLabel: table.displayLabel ?? null,
              capacity: table.capacity,
              note: table.note ?? null,
              isActive: table.isActive,
            }))}
          />
        </div>
      </div>
    </main>
  );
}