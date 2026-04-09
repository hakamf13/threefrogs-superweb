"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  Navigation,
  ShieldCheck,
  Store,
} from "lucide-react";
import { PRICE_PER_HOUR } from "../../lib/constants";
import { formatHourLabel, formatRupiah } from "../../lib/utils";
import ReserveStoreCards from "@/components/reservations/reserve-store-cards";

type TableSlot = {
  hour: number;
  isAvailable: boolean;
  reason: "PAST_TIME" | "BOOKED" | null;
};

type StoreOption = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  description: string | null;
  locationHint: string | null;
  coverImageUrl: string | null;
  category: string | null;
  activeTableCount: number;
};

type AvailabilityTable = {
  id: string;
  tableNumber: number;
  tableCode: string | null;
  capacity: number | null;
  displayLabel: string | null;
  note: string | null;
  slots: TableSlot[];
};

type CurrentUser = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

type ReserveClientProps = {
  stores: StoreOption[];
  defaultDate: string;
  maxDate: string;
  currentUser: CurrentUser;
  initialStoreId?: string;
};

const panelClass =
  "rounded-[1.6rem] border border-[var(--tf-border)] bg-[var(--tf-surface)] p-4 shadow-[var(--tf-shadow-card)] sm:p-5 lg:p-6";

function getLocationText(store?: StoreOption) {
  if (!store) return "-";
  return store.address?.trim() || store.city?.trim() || "Surabaya";
}

export default function ReserveClient({
  stores,
  defaultDate,
  maxDate,
  currentUser,
  initialStoreId,
}: ReserveClientProps) {
  const router = useRouter();

  const [selectedStoreId, setSelectedStoreId] = useState<string>(
    initialStoreId || stores[0]?.id || ""
  );
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [notes, setNotes] = useState("");

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

  const selectedSlotLabels = useMemo(
    () => selectedSlots.map((hour) => formatHourLabel(hour)),
    [selectedSlots]
  );

  const totalHours = selectedSlots.length;
  const totalPrice = totalHours * PRICE_PER_HOUR;
  const isProfileComplete = Boolean(currentUser.name && currentUser.phone);

  useEffect(() => {
    if (!initialStoreId) return;
    setSelectedStoreId(initialStoreId);
    setSelectedTableId("");
    setSelectedSlots([]);
    setErrorMessage("");
  }, [initialStoreId]);

  useEffect(() => {
    if (!selectedStoreId || !selectedDate) return;

    const controller = new AbortController();

    async function loadAvailability() {
      try {
        setIsLoadingAvailability(true);
        setErrorMessage("");

        const response = await fetch(
          `/api/availability?storeId=${selectedStoreId}&bookingDate=${selectedDate}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const result = await response.json();

        if (!response.ok) {
          setErrorMessage(result.error ?? "Gagal mengambil availability.");
          setAvailabilityTables([]);
          return;
        }

        setAvailabilityTables(result.data);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.error(error);
        setErrorMessage("Terjadi kesalahan saat mengambil availability.");
        setAvailabilityTables([]);
      } finally {
        setIsLoadingAvailability(false);
      }
    }

    loadAvailability();

    return () => controller.abort();
  }, [selectedStoreId, selectedDate]);

  useEffect(() => {
    if (!selectedTableId) return;

    const activeTable = availabilityTables.find(
      (table) => table.id === selectedTableId
    );

    if (!activeTable) {
      setSelectedTableId("");
      setSelectedSlots([]);
      return;
    }

    const stillValid = selectedSlots.every((slotHour) =>
      activeTable.slots.some(
        (slot) => slot.hour === slotHour && slot.isAvailable
      )
    );

    if (!stillValid) {
      setSelectedSlots([]);
      setErrorMessage(
        "Ketersediaan meja berubah. Pilih ulang slot jam yang kamu inginkan."
      );
    }
  }, [availabilityTables, selectedTableId, selectedSlots]);

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
    if (!selectedTable) return;

    const targetSlot = selectedTable.slots.find((slot) => slot.hour === hour);

    if (!targetSlot?.isAvailable && !selectedSlots.includes(hour)) {
      return;
    }

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
      setErrorMessage("Slot jam harus dipilih berurutan.");
      return;
    }

    const allStillAvailable = nextSlots.every((slotHour) => {
      const found = selectedTable.slots.find((slot) => slot.hour === slotHour);
      return found?.isAvailable;
    });

    if (!allStillAvailable) {
      setErrorMessage("Ada slot yang sudah tidak tersedia.");
      return;
    }

    setSelectedSlots(nextSlots);
    setErrorMessage("");
  };

  const handleSubmitBooking = async () => {
    if (!isProfileComplete) {
      setErrorMessage("Profil kamu belum lengkap. Nama dan nomor HP wajib ada.");
      return;
    }

    if (
      !selectedStoreId ||
      !selectedDate ||
      !selectedTableId ||
      selectedSlots.length === 0
    ) {
      setErrorMessage("Lengkapi store, tanggal, meja, dan slot jam dulu ya.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storeId: selectedStoreId,
          tableId: selectedTableId,
          bookingDate: selectedDate,
          selectedSlots,
          notes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result.error ?? "Gagal membuat booking.");
        return;
      }

      router.push(`/booking/${result.bookingCode}`);
    } catch (error) {
      console.error(error);
      setErrorMessage("Terjadi kesalahan saat mengirim booking.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-88px)] px-4 py-8 text-slate-800 sm:px-6 sm:py-10 md:py-12">
      <div className="mx-auto max-w-[1140px] space-y-8">
        <section className="space-y-3">
          <p className="inline-flex rounded-full bg-[var(--tf-cream)] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
            Reservasi
          </p>

          <div className="space-y-3">
            <h1 className="text-3xl font-black leading-[0.95] tracking-tight text-[var(--tf-purple)] sm:text-4xl lg:text-5xl">
              Reservasi Mahjong
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              Pilih store, tentukan tanggal main, pilih meja, lalu booking slot
              jam favoritmu. Fokusnya dibuat secepat mungkin untuk dipakai
              operasional, tapi tetap nyaman dan rapi dipandang.
            </p>
          </div>
        </section>

        <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-5">
            <div className={panelClass}>
              <div className="mb-4">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
                  Step 1
                </p>
                <h2 className="mt-2 text-xl font-black text-[var(--tf-purple)] sm:text-2xl">
                  Data Pemesan
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface-muted)] p-4">
                  <p className="text-sm text-slate-500">Nama</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {currentUser.name || "-"}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface-muted)] p-4">
                  <p className="text-sm text-slate-500">Nomor HP</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {currentUser.phone || "-"}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface-muted)] p-4 md:col-span-2">
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {currentUser.email || "Belum diisi"}
                  </p>
                </div>
              </div>

              {!isProfileComplete ? (
                <div className="mt-5 rounded-2xl border border-[#FFD9A8] bg-[var(--tf-cream)] px-4 py-4 text-sm text-[var(--tf-orange-dark)]">
                  <p className="font-semibold">
                    Profil kamu belum lengkap. Nama dan nomor HP wajib ada
                    sebelum booking.
                  </p>
                  <a
                    href="/profile"
                    className="mt-3 inline-flex rounded-xl border border-[var(--tf-orange-dark)] px-3 py-2 text-xs font-bold"
                  >
                    Lengkapi Profil
                  </a>
                </div>
              ) : null}
            </div>

            <div className={panelClass}>
              <div className="mb-4">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
                  Step 2
                </p>
                <h2 className="mt-2 text-xl font-black text-[var(--tf-purple)] sm:text-2xl">
                  Pilih Store
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Pilih store yang paling sesuai dengan lokasi dan preferensimu.
                </p>
              </div>

              <ReserveStoreCards
                stores={stores}
                selectedStoreId={selectedStoreId}
                onSelect={handleSelectStore}
              />

              {selectedStore ? (
                <div className="mt-5 rounded-[1.35rem] border border-[var(--tf-border)] bg-[var(--tf-surface-muted)] p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-white p-3 text-[var(--tf-purple)] shadow-sm">
                      <Store className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-black text-[var(--tf-purple)]">
                        {selectedStore.name}
                      </p>

                      <div className="mt-3 flex items-start gap-2 text-sm text-slate-600">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--tf-purple)]" />
                        <p className="leading-6">{getLocationText(selectedStore)}</p>
                      </div>

                      <div className="mt-3 flex items-start gap-2 text-sm text-slate-600">
                        <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-[var(--tf-purple)]" />
                        <p className="leading-6">
                          {selectedStore.locationHint || "Info lokasi menyusul."}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[var(--tf-purple-dark)]">
                          {selectedStore.activeTableCount} meja aktif
                        </span>
                        <span className="rounded-full bg-[var(--tf-cream)] px-3 py-1 text-xs font-bold text-[var(--tf-orange-dark)]">
                          {selectedStore.category || "MAHJONG"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className={panelClass}>
              <div className="mb-4">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
                  Step 3
                </p>
                <h2 className="mt-2 text-xl font-black text-[var(--tf-purple)] sm:text-2xl">
                  Pilih Tanggal
                </h2>
              </div>

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
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[var(--tf-purple)]"
              />

              <p className="mt-3 text-sm text-slate-500">
                Booking hanya bisa dibuat untuk tanggal {defaultDate} sampai{" "}
                {maxDate}.
              </p>
            </div>

            <div className={panelClass}>
              <div className="mb-4">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
                  Step 4
                </p>
                <h2 className="mt-2 text-xl font-black text-[var(--tf-purple)] sm:text-2xl">
                  Pilih Meja
                </h2>
              </div>

              {isLoadingAvailability ? (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-32 animate-pulse rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface-muted)]"
                    />
                  ))}
                </div>
              ) : availabilityTables.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--tf-border)] bg-[var(--tf-surface-muted)] px-4 py-8 text-center text-slate-500">
                  Belum ada meja aktif atau availability belum tersedia.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {availabilityTables.map((table) => {
                    const isActive = table.id === selectedTableId;
                    const availableCount = table.slots.filter(
                      (slot) => slot.isAvailable
                    ).length;
                    const isFullyBooked = availableCount === 0;

                    return (
                      <button
                        key={table.id}
                        type="button"
                        onClick={() => !isFullyBooked && handleSelectTable(table.id)}
                        disabled={isFullyBooked}
                        className={[
                          "rounded-2xl border p-4 text-left transition",
                          isActive
                            ? "border-[var(--tf-purple)] bg-[#F4EEFF] shadow-sm"
                            : isFullyBooked
                            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                            : "border-[var(--tf-border)] bg-white hover:border-[#C5AFE8]",
                        ].join(" ")}
                      >
                        <p
                          className={`text-lg font-black ${
                            isFullyBooked
                              ? "text-slate-500"
                              : "text-[var(--tf-purple)]"
                          }`}
                        >
                          {table.displayLabel || `Meja ${table.tableNumber}`}
                        </p>

                        {table.note ? (
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {table.note}
                          </p>
                        ) : null}

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-[var(--tf-surface-muted)] px-2.5 py-1 font-semibold">
                            Kapasitas: {table.capacity ?? "-"} orang
                          </span>
                          <span className="rounded-full bg-[var(--tf-cream)] px-2.5 py-1 font-semibold text-[var(--tf-orange-dark)]">
                            {isFullyBooked
                              ? "Full booked"
                              : `${availableCount} slot tersedia`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={panelClass}>
              <div className="mb-4">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
                  Step 5
                </p>
                <h2 className="mt-2 text-xl font-black text-[var(--tf-purple)] sm:text-2xl">
                  Pilih Slot Jam
                </h2>
              </div>

              {!selectedTableId ? (
                <div className="rounded-2xl border border-dashed border-[var(--tf-border)] bg-[var(--tf-surface-muted)] px-4 py-8 text-center text-slate-500">
                  Pilih meja dulu supaya slot jam bisa dipilih.
                </div>
              ) : !selectedTable ? (
                <div className="rounded-2xl border border-dashed border-[var(--tf-border)] bg-[var(--tf-surface-muted)] px-4 py-8 text-center text-slate-500">
                  Meja tidak ditemukan.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface-muted)] p-4">
                    <p className="text-lg font-black text-[var(--tf-purple)]">
                      {selectedTable.displayLabel || `Meja ${selectedTable.tableNumber}`}
                    </p>

                    {selectedTable.note ? (
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {selectedTable.note}
                      </p>
                    ) : null}

                    <p className="mt-2 text-xs text-slate-500">
                      Kapasitas: {selectedTable.capacity ?? "-"} orang
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {selectedTable.slots.map((slot) => {
                      const selected = selectedSlots.includes(slot.hour);
                      const disabled = !slot.isAvailable && !selected;

                      return (
                        <button
                          key={slot.hour}
                          type="button"
                          onClick={() => handleToggleSlot(slot.hour)}
                          disabled={disabled}
                          className={[
                            "rounded-2xl border px-4 py-3 text-left transition",
                            selected
                              ? "border-[var(--tf-purple)] bg-[var(--tf-purple)] text-white shadow-sm"
                              : disabled
                              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                              : "border-[var(--tf-border)] bg-white hover:border-[#C5AFE8]",
                          ].join(" ")}
                        >
                          <span className="font-bold">{formatHourLabel(slot.hour)}</span>
                          <p className="mt-1 text-xs">
                            {slot.isAvailable
                              ? "Tersedia"
                              : slot.reason === "PAST_TIME"
                              ? "Jam sudah lewat"
                              : "Sudah terisi"}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className={panelClass}>
              <div className="mb-4">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
                  Step 6
                </p>
                <h2 className="mt-2 text-xl font-black text-[var(--tf-purple)] sm:text-2xl">
                  Catatan Booking
                </h2>
              </div>

              <textarea
                placeholder="Contoh: tiles besar, datang terlambat 10 menit, prefer meja tertentu, dan lainnya"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[var(--tf-purple)]"
              />
            </div>
          </div>

          <aside className="lg:sticky lg:top-24">
            <div className={`${panelClass} space-y-5`}>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
                  Summary
                </p>
                <h2 className="mt-2 text-xl font-black text-[var(--tf-purple)] sm:text-2xl">
                  Ringkasan Reservasi
                </h2>
              </div>

              <div className="space-y-4 text-sm text-slate-700">
                <div className="rounded-2xl bg-[var(--tf-surface-muted)] p-4">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--tf-purple)]">
                    <ShieldCheck className="h-4 w-4" />
                    Pemesan
                  </div>
                  <p className="mt-2 font-semibold">{currentUser.name || "-"}</p>
                  <p className="mt-1 text-slate-500">{currentUser.phone || "-"}</p>
                </div>

                <div className="rounded-2xl bg-[var(--tf-surface-muted)] p-4">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--tf-purple)]">
                    <Store className="h-4 w-4" />
                    Store
                  </div>
                  <p className="mt-2 font-semibold">{selectedStore?.name ?? "-"}</p>
                  <p className="mt-1 text-slate-500">{getLocationText(selectedStore)}</p>
                  {selectedStore?.locationHint ? (
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {selectedStore.locationHint}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-2xl bg-[var(--tf-surface-muted)] p-4">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--tf-purple)]">
                      <CalendarDays className="h-4 w-4" />
                      Tanggal
                    </div>
                    <p className="mt-2 font-semibold">{selectedDate || "-"}</p>
                  </div>

                  <div className="rounded-2xl bg-[var(--tf-surface-muted)] p-4">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--tf-purple)]">
                      <Clock3 className="h-4 w-4" />
                      Durasi
                    </div>
                    <p className="mt-2 font-semibold">{totalHours} jam</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-[var(--tf-surface-muted)] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--tf-purple)]">
                    Meja
                  </p>
                  <p className="mt-2 font-semibold">
                    {selectedTable
                      ? selectedTable.displayLabel || `Meja ${selectedTable.tableNumber}`
                      : "-"}
                  </p>
                  {selectedTable?.note ? (
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {selectedTable.note}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-2xl bg-[var(--tf-surface-muted)] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--tf-purple)]">
                    Slot Terpilih
                  </p>

                  {selectedSlotLabels.length === 0 ? (
                    <p className="mt-2 font-semibold">-</p>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedSlotLabels.map((label) => (
                        <span
                          key={label}
                          className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[var(--tf-purple-dark)] shadow-sm"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}

                  {selectedSlots.length > 0 ? (
                    <div className="mt-4 rounded-2xl border border-[#C8E7A5] bg-[#F6FFE6] p-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-[var(--tf-green-dark)]">
                        <CheckCircle2 className="h-4 w-4" />
                        Slot terpilih sudah siap
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        Kamu memilih {selectedSlots.length} jam bermain di{" "}
                        {selectedTable
                          ? selectedTable.displayLabel || `Meja ${selectedTable.tableNumber}`
                          : "meja pilihan"}
                        .
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-2xl bg-[var(--tf-surface-muted)] p-4">
                  <p className="text-slate-500">Harga per jam</p>
                  <p className="mt-1 font-semibold">
                    {formatRupiah(PRICE_PER_HOUR)}
                  </p>

                  <div className="mt-4 border-t border-[var(--tf-border)] pt-4">
                    <p className="text-slate-500">Total</p>
                    <p className="mt-1 text-3xl font-black tracking-tight text-[var(--tf-purple)]">
                      {formatRupiah(totalPrice)}
                    </p>
                  </div>
                </div>
              </div>

              {errorMessage ? (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{errorMessage}</p>
                  </div>
                </div>
              ) : null}

              <div className="rounded-[1.25rem] bg-[var(--tf-lavender)] p-4">
                <p className="text-sm font-bold text-[var(--tf-purple-dark)]">
                  Tips Booking
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Pilih slot berurutan agar sistem bisa memproses booking lebih
                  cepat dan lebih aman dari konflik availability.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSubmitBooking}
                disabled={
                  isSubmitting ||
                  !isProfileComplete ||
                  !selectedStoreId ||
                  !selectedDate ||
                  !selectedTableId ||
                  selectedSlots.length === 0
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--tf-purple)] px-4 py-3.5 font-bold text-white transition hover:bg-[var(--tf-purple-dark)] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan Booking...
                  </>
                ) : (
                  "Buat Booking"
                )}
              </button>

              <div className="rounded-2xl bg-slate-50 p-4 text-xs leading-6 text-slate-600">
                <p>• Slot abu-abu berarti sudah terisi atau jamnya sudah lewat.</p>
                <p>• Slot yang dipilih harus berurutan.</p>
                <p>• Booking akan di-hold selama 15 menit sambil menunggu pembayaran.</p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}