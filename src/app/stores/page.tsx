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
    <main className="min-h-screen bg-[#F8F4FF] px-6 py-16 text-slate-800">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-3 text-4xl font-black text-[#5D3FD3]">
          Store Mahjong
        </h1>
        <p className="mb-10 text-slate-600">
          Daftar store mahjong Threefrogs yang siap untuk reservasi.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {stores.map((store) => (
            <div
              key={store.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="mb-2 text-2xl font-bold text-[#5D3FD3]">
                {store.name}
              </h2>
              <p className="mb-2 text-slate-600">{store.description}</p>
              <p className="text-sm text-slate-500">Alamat: {store.address}</p>
              <p className="text-sm text-slate-500">Kota: {store.city}</p>
              <p className="mt-3 text-sm font-semibold text-slate-700">
                Jumlah meja aktif: {store.tables.length}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}