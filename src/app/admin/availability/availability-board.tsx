"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Loader2, Store } from "lucide-react";
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

const panelClass =
  "rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]";

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
      return "Menunggu bayar";
    case "PENDING_VERIFICATION":
      return "Menunggu verifikasi";
    case "CONFIRMED":
      return "Terkonfirmasi";
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
    <main className="min-h-screen bg-[var(--tf-bg)] px-4 py-12 text-slate-800 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
              Availability Admin
            </p>
            <h1 className="mt-3 text-4xl font-black text-[var(--tf-purple)]">
              Availability Meja
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Lihat status slot per meja secara visual untuk membantu operasional
              harian dan menghindari konflik availability.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/manual-booking"
              className="rounded-2xl bg-[var(--tf-purple)] px-5 py-3 font-bold text-white transition hover:bg-[var(--tf-purple-dark)]"
            >
              Manual Booking
            </Link>
            <Link
              href="/admin"
              className="rounded-2xl border border-[var(--tf-purple)] px-5 py-3 font-bold text-[var(--tf-purple)]"
            >
              Dashboard
            </Link>
          </div>
        </div>

        <section className={panelClass}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Store
              </label>
              <div className="relative">
                <Store className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-[var(--tf-purple)]"
                >
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Tanggal
              </label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-[var(--tf-purple)]"
                />
              </div>
            </div>
          </div>

          {selectedStore ? (
            <div className="mt-5 rounded-2xl bg-[var(--tf-surface-muted)] px-4 py-4 text-sm text-slate-600">
              Store aktif:{" "}
              <span className="font-semibold text-[var(--tf-purple)]">
                {selectedStore.name}
              </span>
            </div>
          ) : null}
        </section>

        <section className={panelClass}>
          <h2 className="mb-4 text-xl font-bold text-[var(--tf-purple)]">
            Legenda
          </h2>

          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-slate-700">
              Kosong
            </div>
            <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2 text-orange-700">
              Menunggu bayar
            </div>
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-2 text-yellow-700">
              Menunggu verifikasi
            </div>
            <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-2 text-green-700">
              Terkonfirmasi
            </div>
            <div className="rounded-2xl border border-[var(--tf-purple)] bg-[var(--tf-lavender)] px-4 py-2 text-[var(--tf-purple-dark)]">
              Open Table
            </div>
          </div>
        </section>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className={panelClass}>
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memuat availability...
            </div>
          </div>
        ) : null}

        {!isLoading && selectedStore ? (
          <div className="space-y-6">
            {tables.map((table) => (
              <section key={table.id} className={panelClass}>
                <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-[var(--tf-purple)]">
                      Meja {table.tableNumber}
                    </h3>
                    <p className="text-sm text-slate-500">
                      Kapasitas: {table.capacity ?? "-"} orang
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {table.slots.map((slot) => {
                    const clickable =
                      !!slot.bookingId || !!slot.openTableSessionId;

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
                          clickable ? "hover:shadow-sm" : "cursor-default"
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