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
  walkInSessionId?: string | null;
  walkInEstimatedEndAt?: string | null;
  walkInPaymentStatus?: "UNPAID" | "PARTIAL" | "PAID" | null;
};

type AvailabilityTable = {
  id: string;
  tableNumber: number;
  tableCode: string | null;
  capacity: number | null;
  displayLabel?: string | null;
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
    case "WALK_IN":
      return "border-[var(--tf-purple)] bg-[var(--tf-lavender)] text-[var(--tf-purple-dark)]";
    case "AVAILABLE":
    default:
      return "border-slate-200 bg-white text-slate-700";
  }
}

function getCellLabel(status: string) {
  switch (status) {
    case "AWAITING_PAYMENT":
      return "Menunggu pembayaran";
    case "PENDING_VERIFICATION":
      return "Menunggu pengecekan";
    case "CONFIRMED":
      return "Sudah dikonfirmasi";
    case "WALK_IN":
      return "Walk-in aktif";
    case "AVAILABLE":
    default:
      return "Tersedia";
  }
}

function formatWalkInEnd(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getPaymentLabel(
  status: "UNPAID" | "PARTIAL" | "PAID" | null | undefined
) {
  switch (status) {
    case "PAID":
      return "Lunas";
    case "PARTIAL":
      return "DP";
    case "UNPAID":
      return "Belum dibayar";
    default:
      return "-";
  }
}

function getPaymentBadgeClass(
  status: "UNPAID" | "PARTIAL" | "PAID" | null | undefined
) {
  switch (status) {
    case "PAID":
      return "bg-green-50 text-green-700";
    case "PARTIAL":
      return "bg-yellow-50 text-yellow-700";
    case "UNPAID":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
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

  const walkInPageBaseHref = useMemo(() => {
    const params = new URLSearchParams();

    if (selectedStoreId) {
      params.set("storeId", selectedStoreId);
      if (selectedStore?.name) {
        params.set("monitorStore", selectedStore.name);
      }
    }

    if (selectedDate) {
      params.set("availabilityDate", selectedDate);
    }

    return `/admin/walk-in?${params.toString()}`;
  }, [selectedStoreId, selectedStore, selectedDate]);

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
          setErrorMessage(result.error ?? "Data ketersediaan belum bisa ditampilkan.");
          setTables([]);
          return;
        }

        setTables(result.data);
      } catch (error) {
        console.error(error);
        setErrorMessage("Terjadi kendala saat mengambil data ketersediaan.");
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
              Ketersediaan Meja
            </p>
            <h1 className="mt-3 text-4xl font-black text-[var(--tf-purple)]">
              Pantau Jadwal Meja
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Lihat jadwal meja per jam untuk membantu penanganan booking terjadwal
              maupun sesi walk-in.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/manual-booking"
              className="rounded-2xl bg-[var(--tf-purple)] px-5 py-3 font-bold text-white transition hover:bg-[var(--tf-purple-dark)]"
            >
              Buat Booking Manual
            </Link>
            <a
              href={walkInPageBaseHref}
              className="rounded-2xl border border-[var(--tf-purple)] px-5 py-3 font-bold text-[var(--tf-purple)]"
            >
              Kelola Walk-in
            </a>
            <Link
              href="/admin"
              className="rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-700"
            >
              Kembali ke Dashboard
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
              Store yang dipilih:{" "}
              <span className="font-semibold text-[var(--tf-purple)]">
                {selectedStore.name}
              </span>
            </div>
          ) : null}
        </section>

        <section className={panelClass}>
          <h2 className="mb-4 text-xl font-bold text-[var(--tf-purple)]">
            Keterangan Status
          </h2>

          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-slate-700">
              Tersedia
            </div>
            <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2 text-orange-700">
              Menunggu pembayaran
            </div>
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-2 text-yellow-700">
              Menunggu pengecekan
            </div>
            <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-2 text-green-700">
              Sudah dikonfirmasi
            </div>
            <div className="rounded-2xl border border-[var(--tf-purple)] bg-[var(--tf-lavender)] px-4 py-2 text-[var(--tf-purple-dark)]">
              Walk-in aktif
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
              Memuat data ketersediaan...
            </div>
          </div>
        ) : null}

        {!isLoading && selectedStore ? (
          <div className="space-y-6">
            {!isLoading && tables.length > 0 && tables.every((table) => table.slots.length === 0) ? (
              <div className={panelClass}>
                <p className="font-semibold text-[var(--tf-purple)]">
                  Store sedang tutup atau belum memiliki jam operasional pada tanggal ini.
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Cek kembali pengaturan jam operasional di halaman Store Management.
                </p>
              </div>
            ) : null}

            {tables.map((table) => {
              const walkInSlots = table.slots.filter(
                (slot) => slot.status === "WALK_IN" || !!slot.walkInSessionId
              );
              const activeWalkInSlot = walkInSlots[0] ?? null;
              const bookedSlotsCount = table.slots.filter(
                (slot) => slot.status !== "AVAILABLE"
              ).length;
              const availableSlotsCount = table.slots.filter(
                (slot) => slot.status === "AVAILABLE"
              ).length;

              return (
                <section key={table.id} className={panelClass}>
                  <div className="mb-4 flex flex-col gap-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-[var(--tf-purple)]">
                          {table.displayLabel || `Meja ${table.tableNumber}`}
                        </h3>
                        <p className="text-sm text-slate-500">
                          Kapasitas: {table.capacity ?? "-"} orang
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                          Slot kosong {availableSlotsCount}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                          Slot terisi {bookedSlotsCount}
                        </span>
                        {activeWalkInSlot ? (
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentBadgeClass(
                              activeWalkInSlot.walkInPaymentStatus
                            )}`}
                          >
                            Walk-in • {getPaymentLabel(activeWalkInSlot.walkInPaymentStatus)}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {activeWalkInSlot ? (
                      <div className="rounded-2xl border border-[var(--tf-purple)] bg-[var(--tf-lavender)] px-4 py-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="space-y-1 text-sm text-[var(--tf-purple-dark)]">
                            <p className="font-bold">Ada sesi walk-in aktif di meja ini</p>
                            <p>Pelanggan: {activeWalkInSlot.customerName || "-"}</p>
                            <p>
                              Perkiraan selesai:{" "}
                              {formatWalkInEnd(activeWalkInSlot.walkInEstimatedEndAt)}
                            </p>
                            <p>
                              Status pembayaran:{" "}
                              {getPaymentLabel(activeWalkInSlot.walkInPaymentStatus)}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const params = new URLSearchParams();
                              params.set("storeId", selectedStoreId);
                              params.set("monitorStore", selectedStore?.name ?? "");
                              params.set("availabilityDate", selectedDate);

                              if (activeWalkInSlot.walkInSessionId) {
                                params.set("focus", activeWalkInSlot.walkInSessionId);
                              }

                              if (activeWalkInSlot.customerName) {
                                params.set("q", activeWalkInSlot.customerName);
                              } else {
                                params.set(
                                  "q",
                                  table.displayLabel || `Meja ${table.tableNumber}`
                                );
                              }

                              router.push(`/admin/walk-in?${params.toString()}`);
                            }}
                            className="rounded-2xl bg-[var(--tf-purple)] px-4 py-2.5 text-sm font-bold text-white"
                          >
                            Lihat sesi ini
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {table.slots.map((slot) => {
                      const isBookingSlot = !!slot.bookingId;
                      const isWalkInSlot =
                        slot.status === "WALK_IN" || !!slot.walkInSessionId;
                      const isEmptySlot = slot.status === "AVAILABLE";

                      return (
                        <button
                          key={slot.hour}
                          type="button"
                          onClick={() => {
                            if (slot.bookingId) {
                              router.push(`/admin/bookings/${slot.bookingId}`);
                              return;
                            }

                            if (slot.walkInSessionId) {
                              const params = new URLSearchParams();

                              params.set("storeId", selectedStoreId);
                              params.set("monitorStore", selectedStore?.name ?? "");
                              params.set("availabilityDate", selectedDate);
                              params.set("focus", slot.walkInSessionId);

                              if (slot.customerName) {
                                params.set("q", slot.customerName);
                              } else {
                                params.set(
                                  "q",
                                  table.displayLabel || `Meja ${table.tableNumber}`
                                );
                              }

                              router.push(`/admin/walk-in?${params.toString()}`);
                              return;
                            }

                            const params = new URLSearchParams();
                            params.set("storeId", selectedStoreId);
                            params.set("tableId", table.id);
                            params.set("date", selectedDate);
                            params.set("hour", String(slot.hour));
                            params.set("availabilityDate", selectedDate);

                            if (selectedStore?.name) {
                              params.set("monitorStore", selectedStore.name);
                            }

                            router.push(`/admin/walk-in?${params.toString()}`);
                          }}
                          className={`rounded-2xl border p-4 text-left transition hover:-translate-y-[1px] hover:shadow-sm ${getCellClasses(
                            slot.status
                          )}`}
                        >
                          <p className="font-bold">{formatHourLabel(slot.hour)}</p>
                          <p className="mt-2 text-sm font-semibold">
                            {getCellLabel(slot.status)}
                          </p>

                          {isWalkInSlot ? (
                            <div className="mt-3 space-y-1 text-xs">
                              <p>Pelanggan: {slot.customerName || "-"}</p>
                              <p>
                                Perkiraan selesai:{" "}
                                {formatWalkInEnd(slot.walkInEstimatedEndAt)}
                              </p>
                              <p>
                                Status bayar: {getPaymentLabel(slot.walkInPaymentStatus)}
                              </p>
                              <p>Klik untuk membuka sesi ini</p>
                            </div>
                          ) : isBookingSlot ? (
                            <div className="mt-3 space-y-1 text-xs">
                              <p>Kode booking: {slot.bookingCode}</p>
                              <p>Pelanggan: {slot.customerName}</p>
                              <p>Sumber: {slot.source}</p>
                            </div>
                          ) : isEmptySlot ? (
                            <div className="mt-3 space-y-1 text-xs">
                              <p>Slot ini masih tersedia.</p>
                              <p>Klik untuk membuka sesi walk-in dari jam ini.</p>
                            </div>
                          ) : (
                            <div className="mt-3 space-y-1 text-xs">
                              <p>Slot ini belum bisa dipakai.</p>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        ) : null}
      </div>
    </main>
  );
}