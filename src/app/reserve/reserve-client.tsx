"use client";

import { useMemo, useState } from "react";
import { PRICE_PER_HOUR, TIME_SLOTS } from "../../../lib/constants";
import { formatHourLabel, formatRupiah } from "../../../lib/utils";

type StoreOption = {
  id: string;
  name: string;
  slug: string;
  tables: {
    id: string;
    tableNumber: number;
    tableCode: string | null;
    capacity: number | null;
  }[];
};

type ReserveClientProps = {
  stores: StoreOption[];
  defaultDate: string;
};

export default function ReserveClient({
  stores,
  defaultDate,
}: ReserveClientProps) {
  const [selectedStoreId, setSelectedStoreId] = useState<string>(
    stores[0]?.id ?? ""
  );
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);

  const selectedStore = useMemo(
    () => stores.find((store) => store.id === selectedStoreId),
    [stores, selectedStoreId]
  );

  const selectedTable = useMemo(
    () => selectedStore?.tables.find((table) => table.id === selectedTableId),
    [selectedStore, selectedTableId]
  );

  const totalHours = selectedSlots.length;
  const totalPrice = totalHours * PRICE_PER_HOUR;

  const handleSelectStore = (storeId: string) => {
    setSelectedStoreId(storeId);
    setSelectedTableId("");
    setSelectedSlots([]);
  };

  const handleSelectTable = (tableId: string) => {
    setSelectedTableId(tableId);
    setSelectedSlots([]);
  };

  const handleToggleSlot = (hour: number) => {
    if (!selectedTableId) return;

    let nextSlots: number[] = [];

    if (selectedSlots.includes(hour)) {
      nextSlots = selectedSlots.filter((slot) => slot !== hour).sort((a, b) => a - b);
    } else {
      nextSlots = [...selectedSlots, hour].sort((a, b) => a - b);
    }

    const isSequential = nextSlots.every((slot, index) => {
      if (index === 0) return true;
      return slot === nextSlots[index - 1] + 1;
    });

    if (!isSequential) {
      alert("Slot jam harus berurutan ya.");
      return;
    }

    setSelectedSlots(nextSlots);
  };

  return (
    <main className="min-h-screen bg-[#F8F4FF] px-6 py-16 text-slate-800">
      <div className="mx-auto max-w-6xl space-y-10">
        <div>
          <h1 className="text-4xl font-black text-[#5D3FD3]">Reservasi Mahjong</h1>
          <p className="mt-2 text-slate-600">
            Pilih store, tanggal, meja, lalu slot jam bermain.
          </p>
        </div>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-[#5D3FD3]">1. Pilih Store</h2>

              <div className="grid gap-4 md:grid-cols-2">
                {stores.map((store) => {
                  const isActive = store.id === selectedStoreId;

                  return (
                    <button
                      key={store.id}
                      type="button"
                      onClick={() => handleSelectStore(store.id)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        isActive
                          ? "border-[#5D3FD3] bg-[#F3EEFF]"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <p className="text-lg font-bold text-[#5D3FD3]">{store.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {store.tables.length} meja aktif
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-[#5D3FD3]">2. Pilih Tanggal</h2>

              <input
                type="date"
                value={selectedDate}
                min={defaultDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedTableId("");
                  setSelectedSlots([]);
                }}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#5D3FD3]"
              />
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-[#5D3FD3]">3. Pilih Meja</h2>

              {!selectedStore ? (
                <p className="text-slate-500">Belum ada store tersedia.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {selectedStore.tables.map((table) => {
                    const isActive = table.id === selectedTableId;

                    return (
                      <button
                        key={table.id}
                        type="button"
                        onClick={() => handleSelectTable(table.id)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          isActive
                            ? "border-[#5D3FD3] bg-[#F3EEFF]"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <p className="font-bold text-[#5D3FD3]">
                          Meja {table.tableNumber}
                        </p>
                        <p className="text-sm text-slate-500">
                          Kapasitas: {table.capacity ?? "-"} orang
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-[#5D3FD3]">4. Pilih Slot Jam</h2>

              {!selectedTableId ? (
                <p className="text-slate-500">
                  Pilih meja dulu supaya slot jam bisa dipilih.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {TIME_SLOTS.map((hour) => {
                    const selected = selectedSlots.includes(hour);

                    return (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => handleToggleSlot(hour)}
                        className={`rounded-2xl border px-4 py-3 text-left transition ${
                          selected
                            ? "border-[#5D3FD3] bg-[#5D3FD3] text-white"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <span className="font-semibold">{formatHourLabel(hour)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-[#5D3FD3]">
              Ringkasan Reservasi
            </h2>

            <div className="space-y-3 text-sm text-slate-700">
              <div>
                <p className="text-slate-500">Store</p>
                <p className="font-semibold">{selectedStore?.name ?? "-"}</p>
              </div>

              <div>
                <p className="text-slate-500">Tanggal</p>
                <p className="font-semibold">{selectedDate || "-"}</p>
              </div>

              <div>
                <p className="text-slate-500">Meja</p>
                <p className="font-semibold">
                  {selectedTable ? `Meja ${selectedTable.tableNumber}` : "-"}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Slot Terpilih</p>
                {selectedSlots.length === 0 ? (
                  <p className="font-semibold">-</p>
                ) : (
                  <ul className="list-inside list-disc space-y-1">
                    {selectedSlots.map((hour) => (
                      <li key={hour}>{formatHourLabel(hour)}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="text-slate-500">Durasi</p>
                <p className="font-semibold">{totalHours} jam</p>
              </div>

              <div>
                <p className="text-slate-500">Harga per jam</p>
                <p className="font-semibold">{formatRupiah(PRICE_PER_HOUR)}</p>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <p className="text-slate-500">Total</p>
                <p className="text-2xl font-black text-[#5D3FD3]">
                  {formatRupiah(totalPrice)}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={!selectedStoreId || !selectedDate || !selectedTableId || selectedSlots.length === 0}
              className="mt-6 w-full rounded-2xl bg-[#5D3FD3] px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Lanjut ke Booking
            </button>

            <p className="mt-3 text-xs text-slate-500">
              Untuk tahap ini, tombol belum menyimpan data. Kita lagi bangun UI dan alur dasar dulu.
            </p>
          </aside>
        </section>
      </div>
    </main>
  );
}