"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PRICE_PER_HOUR } from "../../../lib/constants";
import { formatHourLabel, formatRupiah } from "../../../lib/utils";

type TableSlot = {
  hour: number;
  isAvailable: boolean;
  reason: "PAST_TIME" | "BOOKED" | null;
};

type AvailabilityTable = {
  id: string;
  tableNumber: number;
  tableCode: string | null;
  capacity: number | null;
  slots: TableSlot[];
};

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

function getTodayDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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

  const [availabilityTables, setAvailabilityTables] = useState<AvailabilityTable[]>([]);
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
          `/api/availability?storeId=${selectedStoreId}&bookingDate=${selectedDate}`
        );

        const result = await response.json();

        if (!response.ok) {
          setErrorMessage(result.error ?? "Gagal mengambil availability.");
          setAvailabilityTables([]);
          return;
        }

        setAvailabilityTables(result.data);
      } catch (error) {
        console.error(error);
        setErrorMessage("Terjadi kesalahan saat mengambil availability.");
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

    const selectedTableSlot = selectedTable.slots.find((slot) => slot.hour === hour);
    if (!selectedTableSlot?.isAvailable && !selectedSlots.includes(hour)) {
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
      alert("Slot jam harus berurutan ya.");
      return;
    }

    const allStillAvailable = nextSlots.every((slotHour) => {
      const found = selectedTable.slots.find((slot) => slot.hour === slotHour);
      return found?.isAvailable;
    });

    if (!allStillAvailable) {
      alert("Ada slot yang tidak tersedia.");
      return;
    }

    setSelectedSlots(nextSlots);
    setErrorMessage("");
  };

  const handleSubmit = async () => {
    if (!selectedStoreId || !selectedTableId || selectedSlots.length === 0) {
      setErrorMessage("Lengkapi store, meja, dan slot dulu.");
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage("Nama customer dan nomor HP wajib diisi.");
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
        setErrorMessage(result.error ?? "Gagal membuat manual booking.");
        return;
      }

      router.push(`/admin/bookings/${result.bookingId}`);
    } catch (error) {
      console.error(error);
      setErrorMessage("Terjadi kesalahan saat membuat manual booking.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8F4FF] px-6 py-16 text-slate-800">
      <div className="mx-auto max-w-6xl space-y-10">
        <div>
          <h1 className="text-4xl font-black text-[#5D3FD3]">Manual Booking</h1>
          <p className="mt-2 text-slate-600">
            Buat booking manual untuk walk-in atau input admin.
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
                max={maxDate}
                onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedTableId("");
                    setSelectedSlots([]);
                }}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#5D3FD3]"
                />

                <p className="mt-2 text-sm text-slate-500">
                Booking hanya bisa dibuat untuk tanggal {defaultDate} sampai {maxDate}.
                </p>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-[#5D3FD3]">3. Pilih Meja</h2>

              {isLoadingAvailability ? (
                <p className="text-slate-500">Memuat meja...</p>
              ) : availabilityTables.length === 0 ? (
                <p className="text-slate-500">Belum ada meja tersedia.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {availabilityTables.map((table) => {
                    const isActive = table.id === selectedTableId;
                    const availableCount = table.slots.filter((slot) => slot.isAvailable).length;
                    const isFullyBooked = availableCount === 0;

                    return (
                        <button
                        key={table.id}
                        type="button"
                        onClick={() => !isFullyBooked && handleSelectTable(table.id)}
                        disabled={isFullyBooked}
                        className={`rounded-2xl border p-4 text-left transition ${
                            isActive
                            ? "border-[#5D3FD3] bg-[#F3EEFF]"
                            : isFullyBooked
                            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                        >
                        <p className={`font-bold ${isFullyBooked ? "text-slate-500" : "text-[#5D3FD3]"}`}>
                            Meja {table.tableNumber}
                        </p>
                        <p className="text-sm text-slate-500">
                            Kapasitas: {table.capacity ?? "-"} orang
                        </p>
                        <p className="mt-2 text-xs">
                            {isFullyBooked ? "Full booked hari ini" : `Slot tersedia: ${availableCount}`}
                        </p>
                        </button>
                        );
                    })}
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-[#5D3FD3]">4. Pilih Slot</h2>

              {!selectedTableId ? (
                <p className="text-slate-500">Pilih meja dulu.</p>
              ) : !selectedTable ? (
                <p className="text-slate-500">Meja tidak ditemukan.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {selectedTable.slots.map((slot) => {
                    const selected = selectedSlots.includes(slot.hour);
                    const disabled = !slot.isAvailable && !selected;

                    return (
                      <button
                        key={slot.hour}
                        type="button"
                        onClick={() => handleToggleSlot(slot.hour)}
                        disabled={disabled}
                        className={`rounded-2xl border px-4 py-3 text-left transition ${
                          selected
                            ? "border-[#5D3FD3] bg-[#5D3FD3] text-white"
                            : disabled
                            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <span className="font-semibold">
                          {formatHourLabel(slot.hour)}
                        </span>
                        <p className="mt-1 text-xs">
                          {slot.isAvailable
                            ? "Tersedia"
                            : slot.reason === "PAST_TIME"
                            ? "Lewat"
                            : "Terisi"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-[#5D3FD3]">5. Data Customer</h2>

              <div className="grid gap-4">
                <input
                  type="text"
                  placeholder="Nama customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#5D3FD3]"
                />

                <input
                  type="text"
                  placeholder="Nomor HP customer"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#5D3FD3]"
                />

                <input
                  type="email"
                  placeholder="Email (opsional)"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#5D3FD3]"
                />

                <textarea
                  placeholder="Catatan (opsional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#5D3FD3]"
                />
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-[#5D3FD3]">6. Pengaturan Booking</h2>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Sumber Booking
                  </label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as "WALK_IN" | "ADMIN")}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#5D3FD3]"
                  >
                    <option value="WALK_IN">Walk-in</option>
                    <option value="ADMIN">Input Admin</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Status Awal
                  </label>
                  <select
                    value={initialStatus}
                    onChange={(e) =>
                      setInitialStatus(
                        e.target.value as "CONFIRMED" | "AWAITING_PAYMENT"
                      )
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#5D3FD3]"
                  >
                    <option value="CONFIRMED">Langsung Confirmed</option>
                    <option value="AWAITING_PAYMENT">Menunggu Pembayaran</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-[#5D3FD3]">
              Ringkasan Manual Booking
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
                <p className="text-slate-500">Slot</p>
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
                <p className="text-slate-500">Total</p>
                <p className="text-2xl font-black text-[#5D3FD3]">
                  {formatRupiah(totalPrice)}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Source</p>
                <p className="font-semibold">{source}</p>
              </div>

              <div>
                <p className="text-slate-500">Status Awal</p>
                <p className="font-semibold">{initialStatus}</p>
              </div>
            </div>

            {errorMessage ? (
              <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
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
              className="mt-6 w-full rounded-2xl bg-[#5D3FD3] px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? "Menyimpan..." : "Buat Manual Booking"}
            </button>
          </aside>
        </section>
      </div>
    </main>
  );
}