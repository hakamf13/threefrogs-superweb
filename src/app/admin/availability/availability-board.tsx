"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatHourLabel } from "../../../lib/utils";

type StoreOption = {
  id: string;
  name: string;
  slug: string;
};

type AvailabilityCell = {
  hour: number;
  isAvailable: boolean;
  status: string;
  bookingId: string | null;
  bookingCode: string | null;
  customerName: string | null;
  customerPhone: string | null;
  source: string | null;
  openTableSessionId: string | null;
};

type AvailabilityTable = {
  id: string;
  tableNumber: number;
  tableCode: string | null;
  capacity: number | null;
  slots: AvailabilityCell[];
};

type AdminAvailabilityBoardProps = {
  stores: StoreOption[];
  defaultDate: string;
};

function getCellClasses(status: string) {
  switch (status) {
    case "AWAITING_PAYMENT":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "PENDING_VERIFICATION":
      return "border-yellow-200 bg-yellow-50 text-yellow-700";
    case "CONFIRMED":
      return "border-green-200 bg-green-50 text-green-700";
    case "OPEN_TABLE":
      return "border-[var(--tf-purple)] bg-[var(--tf-lavender)] text-[var(--tf-purple-dark)]";
    case "AVAILABLE":
    default:
      return "border-slate-200 bg-white text-slate-700";
  }
}

function getCellLabel(status: string) {
  switch (status) {
    case "AWAITING_PAYMENT":
      return "Menunggu Bayar";
    case "PENDING_VERIFICATION":
      return "Menunggu Verif";
    case "CONFIRMED":
      return "Confirmed";
    case "OPEN_TABLE":
      return "Open Table";
    case "AVAILABLE":
    default:
      return "Kosong";
  }
}

export default function AdminAvailabilityBoard({
  stores,
  defaultDate,
}: AdminAvailabilityBoardProps) {
  const router = useRouter();

  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id ?? "");
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [tables, setTables] = useState<AvailabilityTable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedStore = useMemo(
    () => stores.find((store) => store.id === selectedStoreId),
    [stores, selectedStoreId]
  );

  useEffect(() => {
    async function loadAvailability() {
      if (!selectedStoreId || !selectedDate) return;

      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch(
          `/api/admin/availability?storeId=${selectedStoreId}&bookingDate=${selectedDate}`
        );

        const result = await response.json();

        if (!response.ok) {
          setErrorMessage(result.error ?? "Gagal mengambil availability.");
          setTables([]);
          return;
        }

        setTables(result.data);
      } catch (error) {
        console.error(error);
        setErrorMessage("Terjadi kesalahan saat mengambil availability.");
        setTables([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadAvailability();
  }, [selectedStoreId, selectedDate]);

  return (
    <main className="min-h-screen bg-[#F8F4FF] px-6 py-16 text-slate-800">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-4xl font-black text-[#5D3FD3]">
              Availability Admin
            </h1>
            <p className="mt-2 text-slate-600">
              Lihat ketersediaan meja dan slot per store secara visual.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/manual-booking"
              className="rounded-2xl bg-[#5D3FD3] px-5 py-3 font-bold text-white"
            >
              Manual Booking
            </Link>
            <Link
              href="/admin/bookings"
              className="rounded-2xl border border-[#5D3FD3] px-5 py-3 font-bold text-[#5D3FD3]"
            >
              Semua Booking
            </Link>
          </div>
        </div>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Store
              </label>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#5D3FD3]"
              >
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Tanggal
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#5D3FD3]"
              />
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-[#5D3FD3]">Legenda</h2>

          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-slate-700">
              Kosong
            </div>
            <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2 text-orange-700">
              Menunggu Bayar
            </div>
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-2 text-yellow-700">
              Menunggu Verif
            </div>
            <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-2 text-green-700">
              Confirmed
            </div>
            <div className="rounded-2xl border border-[var(--tf-purple)] bg-[var(--tf-lavender)] px-4 py-2 text-[var(--tf-purple-dark)]">
              Open Table
          </div>
          </div>
        </section>

        {errorMessage ? (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <p className="text-slate-500">Memuat availability...</p>
          </div>
        ) : null}

        {!isLoading && selectedStore ? (
          <div className="space-y-6">
            {tables.map((table) => (
              <section
                key={table.id}
                className="rounded-3xl bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-[#5D3FD3]">
                      Meja {table.tableNumber}
                    </h3>
                    <p className="text-sm text-slate-500">
                      Kapasitas: {table.capacity ?? "-"} orang
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {table.slots.map((slot) => {
                    const clickable = !!slot.bookingId || !!slot.openTableSessionId;

                    return (
                      <button
                        key={slot.hour}
                        type="button"
                        disabled={!clickable}
                        onClick={() => {
                          if (slot.bookingId) {
                            router.push(`/admin/bookings/${slot.bookingId}`);
                            return;
                          }

                          if (slot.openTableSessionId) {
                            router.push(`/admin/open-tables`);
                          }
                        }}
                        className={`rounded-2xl border p-4 text-left transition ${getCellClasses(
                          slot.status
                        )} ${
                          clickable
                            ? "hover:shadow-sm"
                            : "cursor-default"
                        } disabled:opacity-100`}
                      >
                        <p className="font-bold">{formatHourLabel(slot.hour)}</p>
                        <p className="mt-2 text-sm font-semibold">
                          {getCellLabel(slot.status)}
                        </p>

                        {slot.status === "OPEN_TABLE" ? (
                          <div className="mt-3 space-y-1 text-xs">
                            <p>Mode: Open Table</p>
                            <p>Nama: {slot.customerName}</p>
                          </div>
                        ) : slot.bookingCode ? (
                          <div className="mt-3 space-y-1 text-xs">
                            <p>Kode: {slot.bookingCode}</p>
                            <p>Nama: {slot.customerName}</p>
                            <p>Source: {slot.source}</p>
                          </div>
                        ) : (
                          <p className="mt-3 text-xs text-slate-500">
                            Tersedia untuk booking
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}