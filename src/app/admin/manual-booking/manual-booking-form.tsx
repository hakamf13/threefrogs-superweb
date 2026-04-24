"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PRICE_PER_HOUR } from "../../../lib/constants";
import { formatHourLabel, formatRupiah } from "../../../lib/utils";

type AdminSlotStatus =
  | "AVAILABLE"
  | "PAST_TIME"
  | "BOOKED"
  | "WALK_IN"
  | "AWAITING_PAYMENT"
  | "PENDING_VERIFICATION"
  | "CONFIRMED"
  | "CANCELLED"
  | "EXPIRED";

type TableSlot = {
  hour: number;
  isAvailable: boolean;
  reason?: "PAST_TIME" | "BOOKED" | null;
  status?: AdminSlotStatus;
  bookingId?: string | null;
  bookingCode?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  source?: "ONLINE" | "WALK_IN" | "ADMIN" | string | null;
  openTableSessionId?: string | null;
  walkInSessionId?: string | null;
  walkInEstimatedEndAt?: string | null;
  walkInPaymentStatus?: "UNPAID" | "PARTIAL" | "PAID" | string | null;
};

type AvailabilityTable = {
  id: string;
  tableNumber: number;
  tableCode: string | null;
  displayLabel?: string | null;
  capacity: number | null;
  slots: TableSlot[];
};

function formatJakartaTime(value: string | null | undefined) {
  if (!value) return null;

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getAdminSlotLabel(slot: TableSlot) {
  if (slot.isAvailable) return "Tersedia";

  if (slot.status === "WALK_IN") return "Walk-in aktif";
  if (slot.status === "AWAITING_PAYMENT") return "Menunggu pembayaran";
  if (slot.status === "PENDING_VERIFICATION") return "Menunggu verifikasi";
  if (slot.status === "CONFIRMED") return "Booking confirmed";
  if (slot.status === "CANCELLED") return "Dibatalkan";
  if (slot.status === "EXPIRED") return "Expired";

  if (slot.reason === "PAST_TIME") return "Sudah lewat";
  if (slot.reason === "BOOKED") return "Sudah terisi";

  return "Tidak tersedia";
}

function getAdminSlotDetail(slot: TableSlot) {
  if (slot.status === "WALK_IN") {
    const estimatedEnd = formatJakartaTime(slot.walkInEstimatedEndAt);
    const paymentLabel = slot.walkInPaymentStatus
      ? `Payment: ${slot.walkInPaymentStatus}`
      : null;

    return [
      slot.customerName || "Walk-in",
      estimatedEnd ? `Estimasi selesai ${estimatedEnd}` : null,
      paymentLabel,
    ]
      .filter(Boolean)
      .join(" • ");
  }

  if (slot.bookingCode) {
    return [
      slot.bookingCode,
      slot.customerName,
      slot.source ? `Source: ${slot.source}` : null,
    ]
      .filter(Boolean)
      .join(" • ");
  }

  return null;
}

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

type AdminManualBookingFormProps = {
  stores: StoreOption[];
  defaultDate: string;
  maxDate: string;
};

function getSlotStatus(slot: TableSlot): AdminSlotStatus {
  if (slot.status) return slot.status;
  if (slot.isAvailable) return "AVAILABLE";
  if (slot.reason === "PAST_TIME") return "PAST_TIME";
  if (slot.reason === "BOOKED") return "BOOKED";

  return "BOOKED";
}

function getSlotLabel(slot: TableSlot) {
  const status = getSlotStatus(slot);

  if (status === "AVAILABLE") return "Tersedia";
  if (status === "PAST_TIME") return "Sudah lewat";
  if (status === "WALK_IN") return "Walk-in aktif";
  if (status === "AWAITING_PAYMENT") return "Menunggu pembayaran";
  if (status === "PENDING_VERIFICATION") return "Menunggu verifikasi";
  if (status === "CONFIRMED") return "Booking confirmed";
  if (status === "CANCELLED") return "Dibatalkan";
  if (status === "EXPIRED") return "Expired";

  return "Sudah terisi";
}

function getSourceLabel(source: TableSlot["source"]) {
  if (source === "ONLINE") return "Online";
  if (source === "WALK_IN") return "Walk-in";
  if (source === "ADMIN") return "Admin";

  return source ?? null;
}

function getWalkInPaymentLabel(status: TableSlot["walkInPaymentStatus"]) {
  if (status === "UNPAID") return "Belum bayar";
  if (status === "PARTIAL") return "Bayar sebagian";
  if (status === "PAID") return "Lunas";

  return status ?? null;
}

function getSlotDetailLines(slot: TableSlot) {
  const status = getSlotStatus(slot);

  if (status === "AVAILABLE") {
    return ["Slot bisa dipilih untuk booking manual."];
  }

  if (status === "PAST_TIME") {
    return ["Jam ini sudah lewat untuk tanggal hari ini."];
  }

  if (status === "WALK_IN") {
    const estimatedEnd = formatJakartaTime(slot.walkInEstimatedEndAt);
    const paymentLabel = getWalkInPaymentLabel(slot.walkInPaymentStatus);

    return [
      slot.customerName ? `Customer: ${slot.customerName}` : "Customer: Walk-in",
      slot.customerPhone ? `HP: ${slot.customerPhone}` : null,
      estimatedEnd ? `Estimasi selesai: ${estimatedEnd}` : null,
      paymentLabel ? `Pembayaran: ${paymentLabel}` : null,
    ].filter(Boolean) as string[];
  }

  return [
    slot.bookingCode ? `Kode: ${slot.bookingCode}` : null,
    slot.customerName ? `Customer: ${slot.customerName}` : null,
    slot.customerPhone ? `HP: ${slot.customerPhone}` : null,
    getSourceLabel(slot.source) ? `Source: ${getSourceLabel(slot.source)}` : null,
  ].filter(Boolean) as string[];
}

function getSlotTitle(slot: TableSlot) {
  const detail = getSlotDetailLines(slot);

  return [getSlotLabel(slot), ...detail].join(" • ");
}

function getSlotBadgeClass(slot: TableSlot, selected = false) {
  if (selected) {
    return "bg-white/20 text-white";
  }

  const status = getSlotStatus(slot);

  if (status === "AVAILABLE") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "WALK_IN") {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "AWAITING_PAYMENT") {
    return "bg-orange-50 text-orange-700";
  }

  if (status === "PENDING_VERIFICATION") {
    return "bg-blue-50 text-blue-700";
  }

  if (status === "CONFIRMED") {
    return "bg-purple-50 text-purple-700";
  }

  if (status === "PAST_TIME") {
    return "bg-slate-200 text-slate-600";
  }

  if (status === "CANCELLED" || status === "EXPIRED") {
    return "bg-slate-100 text-slate-500";
  }

  return "bg-slate-100 text-slate-600";
}

function getSlotButtonClass(slot: TableSlot, selected: boolean, disabled: boolean) {
  if (selected) {
    return "border-[var(--tf-purple)] bg-[var(--tf-purple)] text-white shadow-sm";
  }

  const status = getSlotStatus(slot);

  if (!disabled && status === "AVAILABLE") {
    return "border-slate-200 bg-white hover:border-[var(--tf-purple)] hover:bg-[#FAF7FF]";
  }

  if (status === "WALK_IN") {
    return "cursor-not-allowed border-amber-200 bg-amber-50 text-amber-900";
  }

  if (status === "AWAITING_PAYMENT") {
    return "cursor-not-allowed border-orange-200 bg-orange-50 text-orange-900";
  }

  if (status === "PENDING_VERIFICATION") {
    return "cursor-not-allowed border-blue-200 bg-blue-50 text-blue-900";
  }

  if (status === "CONFIRMED") {
    return "cursor-not-allowed border-purple-200 bg-purple-50 text-purple-900";
  }

  return "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500";
}

function getTableSlotStats(slots: TableSlot[]) {
  return slots.reduce(
    (stats, slot) => {
      const status = getSlotStatus(slot);

      if (slot.isAvailable) stats.available += 1;
      else stats.unavailable += 1;

      if (status === "WALK_IN") stats.walkIn += 1;
      if (status === "AWAITING_PAYMENT") stats.awaitingPayment += 1;
      if (status === "PENDING_VERIFICATION") stats.pendingVerification += 1;
      if (status === "CONFIRMED") stats.confirmed += 1;
      if (status === "PAST_TIME") stats.pastTime += 1;

      return stats;
    },
    {
      available: 0,
      unavailable: 0,
      walkIn: 0,
      awaitingPayment: 0,
      pendingVerification: 0,
      confirmed: 0,
      pastTime: 0,
    }
  );
}

function getTableSummaryText(slots: TableSlot[]) {
  if (slots.length === 0) return "Tidak ada jam operasional";

  const stats = getTableSlotStats(slots);
  const parts = [`Tersedia: ${stats.available}`];

  if (stats.walkIn > 0) parts.push(`Walk-in: ${stats.walkIn}`);
  if (stats.confirmed > 0) parts.push(`Confirmed: ${stats.confirmed}`);
  if (stats.awaitingPayment > 0) parts.push(`Menunggu bayar: ${stats.awaitingPayment}`);
  if (stats.pendingVerification > 0) parts.push(`Verifikasi: ${stats.pendingVerification}`);
  if (stats.pastTime > 0) parts.push(`Lewat: ${stats.pastTime}`);

  return parts.join(" • ");
}

const panelClass =
  "rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]";

export default function AdminManualBookingForm({
  stores,
  defaultDate,
  maxDate,
}: AdminManualBookingFormProps) {
  const router = useRouter();

  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id ?? "");
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [source, setSource] = useState<"WALK_IN" | "ADMIN">("WALK_IN");
  const [initialStatus, setInitialStatus] = useState<
    "CONFIRMED" | "AWAITING_PAYMENT"
  >("CONFIRMED");

  const [availabilityTables, setAvailabilityTables] = useState<
    AvailabilityTable[]
  >([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedStore = useMemo(
    () => stores.find((store) => store.id === selectedStoreId),
    [stores, selectedStoreId]
  );

  const selectedTable = useMemo(
    () => availabilityTables.find((table) => table.id === selectedTableId),
    [availabilityTables, selectedTableId]
  );

  const totalHours = selectedSlots.length;
  const totalPrice = totalHours * PRICE_PER_HOUR;

  useEffect(() => {
    async function loadAvailability() {
      if (!selectedStoreId || !selectedDate) return;

      try {
        setIsLoadingAvailability(true);
        setErrorMessage("");

        const response = await fetch(
          `/api/admin/availability?storeId=${selectedStoreId}&bookingDate=${selectedDate}`,
          {
            cache: "no-store",
          }
        );

        const contentType = response.headers.get("content-type") ?? "";

        if (!contentType.includes("application/json")) {
          const text = await response.text();

          console.error("Admin availability returned non-JSON response:", {
            status: response.status,
            bodyPreview: text.slice(0, 200),
          });

          setErrorMessage(
            "Endpoint availability admin tidak mengembalikan JSON. Cek route /api/admin/availability."
          );
          setAvailabilityTables([]);
          return;
        }

        const result = await response.json();

        if (!response.ok) {
          setErrorMessage(result.error ?? "Data ketersediaan belum bisa ditampilkan.");
          setAvailabilityTables([]);
          return;
        }

        setAvailabilityTables(result.data);
      } catch (error) {
        console.error(error);
        setErrorMessage("Terjadi kendala saat mengambil data ketersediaan.");
        setAvailabilityTables([]);
      } finally {
        setIsLoadingAvailability(false);
      }
    }

    loadAvailability();
  }, [selectedStoreId, selectedDate]);

  const handleSelectStore = (storeId: string) => {
    setSelectedStoreId(storeId);
    setSelectedTableId("");
    setSelectedSlots([]);
    setErrorMessage("");
  };

  const handleSelectTable = (tableId: string) => {
    setSelectedTableId(tableId);
    setSelectedSlots([]);
    setErrorMessage("");
  };

  const handleToggleSlot = (hour: number) => {
    if (!selectedTableId || !selectedTable) return;

    const selectedTableSlot = selectedTable.slots.find(
      (slot) => slot.hour === hour
    );

    if (!selectedTableSlot?.isAvailable && !selectedSlots.includes(hour)) {
      return;
    }

    let nextSlots: number[] = [];

    if (selectedSlots.includes(hour)) {
      nextSlots = selectedSlots
        .filter((slot) => slot !== hour)
        .sort((a, b) => a - b);
    } else {
      nextSlots = [...selectedSlots, hour].sort((a, b) => a - b);
    }

    const isSequential = nextSlots.every((slot, index) => {
      if (index === 0) return true;
      return slot === nextSlots[index - 1] + 1;
    });

    if (!isSequential) {
      setErrorMessage("Jam yang dipilih harus berurutan.");
      return;
    }

    const allStillAvailable = nextSlots.every((slotHour) => {
      const found = selectedTable.slots.find((slot) => slot.hour === slotHour);
      return found?.isAvailable;
    });

    if (!allStillAvailable) {
      setErrorMessage("Ada jam yang sudah tidak tersedia.");
      return;
    }

    setSelectedSlots(nextSlots);
    setErrorMessage("");
  };

  const handleSubmit = async () => {
    if (!selectedStoreId || !selectedTableId || selectedSlots.length === 0) {
      setErrorMessage("Lengkapi store, meja, dan jam bermain terlebih dahulu.");
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage("Nama pelanggan dan nomor telepon wajib diisi.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const response = await fetch("/api/admin/manual-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storeId: selectedStoreId,
          tableId: selectedTableId,
          bookingDate: selectedDate,
          selectedSlots,
          customerName,
          customerPhone,
          customerEmail,
          notes,
          source,
          initialStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result.error ?? "Booking belum berhasil dibuat.");
        return;
      }

      router.push(`/admin/bookings/${result.bookingId}`);
    } catch (error) {
      console.error(error);
      setErrorMessage("Terjadi kendala saat membuat booking.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--tf-bg)] px-4 py-12 text-slate-800 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl space-y-10">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
            Booking Manual
          </p>
          <h1 className="mt-3 text-4xl font-black text-[var(--tf-purple)]">
            Buat Booking Manual
          </h1>
          <p className="mt-2 text-slate-600">
            Gunakan halaman ini untuk melayani walk-in atau membuat booking dari
            admin, sambil tetap menjaga agar jadwal meja tidak bentrok.
          </p>
        </div>

        <section className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-8">
            <div className={panelClass}>
              <h2 className="mb-4 text-xl font-bold text-[var(--tf-purple)]">
                1. Pilih Store
              </h2>

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
                          ? "border-[var(--tf-purple)] bg-[#F3EEFF]"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <p className="text-lg font-bold text-[var(--tf-purple)]">
                        {store.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {store.tables.length} meja aktif
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={panelClass}>
              <h2 className="mb-4 text-xl font-bold text-[var(--tf-purple)]">
                2. Pilih Tanggal Bermain
              </h2>

              <input
                type="date"
                value={selectedDate}
                min={defaultDate}
                max={maxDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedTableId("");
                  setSelectedSlots([]);
                  setErrorMessage("");
                }}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
              />

              <p className="mt-2 text-sm text-slate-500">
                Booking dapat dibuat untuk tanggal {defaultDate} sampai {maxDate}.
              </p>
            </div>

            <div className={panelClass}>
              <h2 className="mb-4 text-xl font-bold text-[var(--tf-purple)]">
                3. Pilih Meja
              </h2>

              {isLoadingAvailability ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memuat data meja...
                </div>
              ) : availabilityTables.length === 0 ? (
                <p className="text-slate-500">Belum ada meja yang bisa dipilih.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {availabilityTables.map((table) => {
                    const isActive = table.id === selectedTableId;
                    const stats = getTableSlotStats(table.slots);
                    const hasNoOperatingSlots = table.slots.length === 0;
                    const isFullyOccupied = table.slots.length > 0 && stats.available === 0;
                    const tableLabel = table.displayLabel || `Meja ${table.tableNumber}`;

                    return (
                      <button
                        key={table.id}
                        type="button"
                        onClick={() => !hasNoOperatingSlots && handleSelectTable(table.id)}
                        disabled={hasNoOperatingSlots}
                        title={getTableSummaryText(table.slots)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          isActive
                            ? "border-[var(--tf-purple)] bg-[#F3EEFF] shadow-sm ring-2 ring-[var(--tf-purple)]/10"
                            : hasNoOperatingSlots
                              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                              : isFullyOccupied
                                ? "border-slate-200 bg-slate-50 hover:border-slate-300"
                                : "border-slate-200 bg-white hover:border-[var(--tf-purple)]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p
                              className={`truncate text-base font-bold ${
                                isFullyOccupied && !isActive
                                  ? "text-slate-600"
                                  : "text-[var(--tf-purple)]"
                              }`}
                            >
                              {tableLabel}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              Kapasitas {table.capacity ?? "-"} orang
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                              stats.available > 0
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {stats.available} tersedia
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {stats.walkIn > 0 ? (
                            <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
                              Walk-in {stats.walkIn}
                            </span>
                          ) : null}

                          {stats.confirmed > 0 ? (
                            <span className="rounded-full bg-purple-50 px-2 py-1 text-[11px] font-semibold text-purple-700">
                              Booking {stats.confirmed}
                            </span>
                          ) : null}

                          {stats.awaitingPayment > 0 ? (
                            <span className="rounded-full bg-orange-50 px-2 py-1 text-[11px] font-semibold text-orange-700">
                              Bayar {stats.awaitingPayment}
                            </span>
                          ) : null}

                          {stats.pendingVerification > 0 ? (
                            <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
                              Verifikasi {stats.pendingVerification}
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-3 line-clamp-1 text-xs text-slate-500">
                          {getTableSummaryText(table.slots)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={panelClass}>
              <h2 className="mb-4 text-xl font-bold text-[var(--tf-purple)]">
                4. Pilih Jam Bermain
              </h2>

              {!selectedTableId ? (
                <p className="text-slate-500">Pilih meja terlebih dahulu.</p>
              ) : !selectedTable ? (
                <p className="text-slate-500">Meja tidak ditemukan.</p>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800">
                          {selectedTable.displayLabel || `Meja ${selectedTable.tableNumber}`}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {getTableSummaryText(selectedTable.slots)}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-1.5">
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                          Tersedia
                        </span>
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
                          Walk-in
                        </span>
                        <span className="rounded-full bg-purple-50 px-2 py-1 text-[10px] font-semibold text-purple-700">
                          Booking
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {selectedTable.slots.map((slot) => {
                      const selected = selectedSlots.includes(slot.hour);
                      const disabled = !slot.isAvailable && !selected;
                      const detailLines = getSlotDetailLines(slot);

                      return (
                        <button
                          key={slot.hour}
                          type="button"
                          onClick={() => handleToggleSlot(slot.hour)}
                          disabled={disabled}
                          title={getSlotTitle(slot)}
                          className={`rounded-2xl border px-4 py-3 text-left transition ${getSlotButtonClass(
                            slot,
                            selected,
                            disabled
                          )}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="font-semibold">
                              {formatHourLabel(slot.hour)}
                            </span>

                            <span
                              className={`rounded-full px-2 py-1 text-[11px] font-bold ${getSlotBadgeClass(
                                slot,
                                selected
                              )}`}
                            >
                              {getSlotLabel(slot)}
                            </span>
                          </div>

                          {detailLines.length > 0 ? (
                            <div
                              className={`mt-2 space-y-0.5 text-[11px] leading-snug ${
                                selected ? "text-white/80" : "text-slate-500"
                              }`}
                            >
                              {detailLines.slice(0, slot.isAvailable ? 1 : 3).map((line) => (
                                <p key={line} className="line-clamp-1 break-words">
                                  {line}
                                </p>
                              ))}
                            </div>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-xs text-slate-500">
                    Catatan: jam yang dipilih harus berurutan. Slot yang sedang dipakai
                    walk-in atau sudah memiliki booking tidak bisa dipilih.
                  </p>
                </div>
              )}
            </div>

            <div className={panelClass}>
              <h2 className="mb-4 text-xl font-bold text-[var(--tf-purple)]">
                5. Data Pelanggan
              </h2>

              <div className="grid gap-4">
                <input
                  type="text"
                  placeholder="Nama pelanggan"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
                />

                <input
                  type="text"
                  placeholder="Nomor telepon pelanggan"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
                />

                <input
                  type="email"
                  placeholder="Email (opsional)"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
                />

                <textarea
                  placeholder="Catatan tambahan (opsional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
                />
              </div>
            </div>

            <div className={panelClass}>
              <h2 className="mb-4 text-xl font-bold text-[var(--tf-purple)]">
                6. Pengaturan Booking
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Sumber booking
                  </label>
                  <select
                    value={source}
                    onChange={(e) =>
                      setSource(e.target.value as "WALK_IN" | "ADMIN")
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
                  >
                    <option value="WALK_IN">Walk-in</option>
                    <option value="ADMIN">Input admin</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Status awal
                  </label>
                  <select
                    value={initialStatus}
                    onChange={(e) =>
                      setInitialStatus(
                        e.target.value as "CONFIRMED" | "AWAITING_PAYMENT"
                      )
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
                  >
                    <option value="CONFIRMED">Langsung dikonfirmasi</option>
                    <option value="AWAITING_PAYMENT">
                      Menunggu pembayaran
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <aside className="xl:sticky xl:top-24">
            <div className={`${panelClass} space-y-4`}>
              <h2 className="text-xl font-bold text-[var(--tf-purple)]">
                Ringkasan Booking
              </h2>

              <div className="space-y-3 text-sm text-slate-700">
                <div>
                  <p className="text-slate-500">Store</p>
                  <p className="font-semibold">{selectedStore?.name ?? "-"}</p>
                </div>

                <div>
                  <p className="text-slate-500">Tanggal bermain</p>
                  <p className="font-semibold">{selectedDate || "-"}</p>
                </div>

                <div>
                  <p className="text-slate-500">Meja</p>
                  <p className="font-semibold">
                    {selectedTable ? `Meja ${selectedTable.tableNumber}` : "-"}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">Jam bermain</p>
                  {selectedSlots.length === 0 ? (
                    <p className="font-semibold">-</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-semibold">
                        {formatHourLabel(selectedSlots[0])} -{" "}
                        {formatHourLabel(selectedSlots[selectedSlots.length - 1] + 1)}
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        {selectedSlots.map((hour) => (
                          <span
                            key={hour}
                            className="rounded-full bg-[#F3EEFF] px-2.5 py-1 text-xs font-semibold text-[var(--tf-purple)]"
                          >
                            {formatHourLabel(hour)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-slate-500">Durasi</p>
                  <p className="font-semibold">{totalHours} jam</p>
                </div>

                <div>
                  <p className="text-slate-500">Total biaya</p>
                  <p className="text-2xl font-black text-[var(--tf-purple)]">
                    {formatRupiah(totalPrice)}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">Sumber booking</p>
                  <p className="font-semibold">
                    {source === "WALK_IN" ? "Walk-in" : "Input admin"}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">Status awal</p>
                  <p className="font-semibold">
                    {initialStatus === "CONFIRMED"
                      ? "Langsung dikonfirmasi"
                      : "Menunggu pembayaran"}
                  </p>
                </div>
              </div>

              {errorMessage ? (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {errorMessage}
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  !selectedStoreId ||
                  !selectedTableId ||
                  selectedSlots.length === 0
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--tf-purple)] px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Booking"
                )}
              </button>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}