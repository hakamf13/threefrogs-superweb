"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { formatDateDisplay, formatDateTimeDisplay, formatHourLabel } from "@/lib/utils";
import type {
  TodayOperationsBoardData,
  TodayTableBoardStatus,
} from "@/features/reservations/get-today-operations-board";

type TableStatus = TodayTableBoardStatus;

type TodayOperationsBoardProps = {
  data: TodayOperationsBoardData;
};

type BoardAlertLevel =
  | "NORMAL"
  | "ENDING_SOON"
  | "OVERTIME"
  | "OVERLAP_RISK"
  | "OVERLAP_NOW";

function getStatusCardClass(status: TableStatus) {
  switch (status) {
    case "WALK_IN_ACTIVE":
      return "border-[#5D3FD3] bg-[#F3EEFF]";
    case "BOOKED_NOW":
      return "border-green-200 bg-green-50";
    case "UPCOMING_BOOKING":
      return "border-orange-200 bg-orange-50";
    case "FREE":
    default:
      return "border-slate-200 bg-white";
  }
}

function getStatusLabel(status: TableStatus) {
  switch (status) {
    case "WALK_IN_ACTIVE":
      return "Walk-in aktif";
    case "BOOKED_NOW":
      return "Sedang digunakan";
    case "UPCOMING_BOOKING":
      return "Ada jadwal berikutnya";
    case "FREE":
    default:
      return "Tersedia";
  }
}

function getStatusBadgeClass(status: TableStatus) {
  switch (status) {
    case "WALK_IN_ACTIVE":
      return "bg-[#5D3FD3] text-white";
    case "BOOKED_NOW":
      return "bg-green-600 text-white";
    case "UPCOMING_BOOKING":
      return "bg-orange-500 text-white";
    case "FREE":
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getWalkInPaymentLabel(status: "UNPAID" | "PARTIAL" | "PAID") {
  switch (status) {
    case "PAID":
      return "Lunas";
    case "PARTIAL":
      return "DP";
    case "UNPAID":
    default:
      return "Belum dibayar";
  }
}

function getWalkInPaymentChipClass(status: "UNPAID" | "PARTIAL" | "PAID") {
  switch (status) {
    case "PAID":
      return "bg-green-50 text-green-700";
    case "PARTIAL":
      return "bg-yellow-50 text-yellow-700";
    case "UNPAID":
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getRemainingMinutes(estimatedEndAt: string | Date) {
  return Math.round((new Date(estimatedEndAt).getTime() - Date.now()) / 60000);
}

function getBoardAlertLevel(table: TodayOperationsBoardData["stores"][number]["tables"][number]): BoardAlertLevel {
  if (table.currentStatus !== "WALK_IN_ACTIVE" || !table.walkInSession) {
    return "NORMAL";
  }

  const now = Date.now();
  const estimatedEndAt = new Date(table.walkInSession.estimatedEndAt).getTime();
  const nextBookingStart = table.nextBooking
    ? new Date(
        `${new Date(table.walkInSession.startedAt).toLocaleDateString("en-CA", {
          timeZone: "Asia/Jakarta",
        })}T${String(table.nextBooking.slotHour).padStart(2, "0")}:00:00+07:00`
      ).getTime()
    : null;

  if (nextBookingStart && now >= nextBookingStart) {
    return "OVERLAP_NOW";
  }

  if (estimatedEndAt < now) {
    return "OVERTIME";
  }

  if (nextBookingStart && estimatedEndAt > nextBookingStart) {
    return "OVERLAP_RISK";
  }

  const remaining = getRemainingMinutes(table.walkInSession.estimatedEndAt);
  if (remaining >= 0 && remaining <= 30) {
    return "ENDING_SOON";
  }

  return "NORMAL";
}

function getBoardAlertCopy(
  table: TodayOperationsBoardData["stores"][number]["tables"][number]
) {
  const level = getBoardAlertLevel(table);

  switch (level) {
    case "OVERLAP_NOW":
      return {
        title: "Bentrok dengan jadwal berikutnya",
        description: table.nextBooking
          ? `Sesi aktif sudah masuk ke jadwal booking ${table.nextBooking.bookingCode}.`
          : "Sesi aktif sudah melewati jadwal berikutnya.",
        className: "border-red-200 bg-red-50 text-red-700",
      };
    case "OVERTIME":
      return {
        title: "Sesi sudah lewat waktu",
        description:
          "Periksa apakah sesi perlu diperpanjang, dipindahkan, atau ditutup sekarang.",
        className: "border-red-200 bg-red-50 text-red-700",
      };
    case "OVERLAP_RISK":
      return {
        title: "Berisiko bentrok dengan booking berikutnya",
        description: table.nextBooking
          ? `Estimasi selesai melewati awal booking ${table.nextBooking.bookingCode}.`
          : "Estimasi selesai melewati jadwal berikutnya.",
        className: "border-orange-200 bg-orange-50 text-orange-700",
      };
    case "ENDING_SOON":
      return {
        title: "Sesi akan segera selesai",
        description: "Siapkan tindak lanjut bila pelanggan ingin lanjut bermain.",
        className: "border-orange-200 bg-orange-50 text-orange-700",
      };
    case "NORMAL":
    default:
      return {
        title: "",
        description: "",
        className: "",
      };
  }
}

export default function TodayOperationsBoard({
  data,
}: TodayOperationsBoardProps) {
  const router = useRouter();

  const alertTables = useMemo(() => {
    return data.stores.flatMap((store) =>
      store.tables
        .filter((table) => getBoardAlertLevel(table) !== "NORMAL")
        .map((table) => ({
          storeId: store.id,
          storeName: store.name,
          table,
          alertLevel: getBoardAlertLevel(table),
        }))
    );
  }, [data.stores]);

  const openWalkInPage = (
    storeId: string,
    storeName: string,
    tableId?: string,
    focus?: string,
    q?: string
  ) => {
    const params = new URLSearchParams();

    params.set("storeId", storeId);
    params.set("monitorStore", storeName);
    params.set("availabilityDate", data.today);

    if (tableId) {
      params.set("tableId", tableId);
    }

    if (focus) {
      params.set("focus", focus);
    }

    if (q) {
      params.set("q", q);
    }

    router.push(`/admin/walk-in?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-[var(--tf-bg)] px-6 py-16 text-slate-800">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
              Operasional Hari Ini
            </p>
            <h1 className="mt-3 text-4xl font-black text-[#5D3FD3]">
              Pantau Kondisi Meja Hari Ini
            </h1>
            <p className="mt-2 text-slate-600">
              Tanggal {formatDateDisplay(new Date(`${data.today}T00:00:00.000Z`))} •
              Jam sekarang {String(data.currentHour).padStart(2, "0")}:00 WIB
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/walk-in"
              className="rounded-2xl bg-[#5D3FD3] px-5 py-3 font-bold text-white transition hover:bg-[#4E35B8]"
            >
              Kelola Walk-in
            </Link>

            <Link
              href="/admin/manual-booking"
              className="rounded-2xl border border-[#5D3FD3] px-5 py-3 font-bold text-[#5D3FD3]"
            >
              Buat Booking Manual
            </Link>

            <Link
              href="/admin/availability"
              className="rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-700"
            >
              Lihat Ketersediaan
            </Link>
          </div>
        </div>

        {alertTables.length > 0 ? (
          <section className="rounded-[2rem] border border-red-200 bg-red-50 p-6 shadow-[var(--tf-shadow-card)]">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white p-3 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-widest text-red-700">
                  Perhatian Operasional
                </p>
                <h2 className="text-2xl font-black text-red-700">
                  Ada meja yang perlu ditindaklanjuti
                </h2>
              </div>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {alertTables.slice(0, 6).map((item) => {
                const alertCopy = getBoardAlertCopy(item.table);

                return (
                  <button
                    key={item.table.id}
                    type="button"
                    onClick={() =>
                      openWalkInPage(
                        item.storeId,
                        item.storeName,
                        item.table.id,
                        item.table.walkInSession?.sessionId,
                        item.table.walkInSession?.customerName
                      )
                    }
                    className="rounded-[1.4rem] border border-red-200 bg-white p-4 text-left transition hover:bg-red-50"
                  >
                    <p className="font-bold text-slate-900">
                      {item.storeName} • Meja {item.table.tableNumber}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-red-700">
                      {alertCopy.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-red-700">
                      {alertCopy.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-5">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[var(--tf-shadow-card)]">
            <p className="text-sm text-slate-500">Total meja</p>
            <p className="mt-2 text-3xl font-black text-[#5D3FD3]">
              {data.summary.totalTables}
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[var(--tf-shadow-card)]">
            <p className="text-sm text-slate-500">Walk-in aktif</p>
            <p className="mt-2 text-3xl font-black text-[#5D3FD3]">
              {data.summary.walkInCount}
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[var(--tf-shadow-card)]">
            <p className="text-sm text-slate-500">Sedang digunakan</p>
            <p className="mt-2 text-3xl font-black text-green-600">
              {data.summary.bookedNowCount}
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[var(--tf-shadow-card)]">
            <p className="text-sm text-slate-500">Jadwal berikutnya</p>
            <p className="mt-2 text-3xl font-black text-orange-600">
              {data.summary.upcomingCount}
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[var(--tf-shadow-card)]">
            <p className="text-sm text-slate-500">Meja tersedia</p>
            <p className="mt-2 text-3xl font-black text-slate-700">
              {data.summary.freeCount}
            </p>
          </div>
        </section>

        <div className="space-y-8">
          {data.stores.map((store) => (
            <section
              key={store.id}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]"
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
                    Store
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-[#5D3FD3]">
                    {store.name}
                  </h2>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {store.tables.map((table) => {
                  const alertCopy = getBoardAlertCopy(table);
                  const alertLevel = getBoardAlertLevel(table);

                  return (
                    <div
                      key={table.id}
                      className={`rounded-[2rem] border p-5 shadow-[var(--tf-shadow-card)] ${getStatusCardClass(
                        table.currentStatus
                      )}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-2xl font-black text-[#5D3FD3]">
                            Meja {table.tableNumber}
                          </h3>
                          <p className="text-sm text-slate-600">
                            Kapasitas: {table.capacity ?? "-"} orang
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusBadgeClass(
                            table.currentStatus
                          )}`}
                        >
                          {getStatusLabel(table.currentStatus)}
                        </span>
                      </div>

                      {alertLevel !== "NORMAL" ? (
                        <div className={`mt-4 rounded-2xl border px-4 py-4 ${alertCopy.className}`}>
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                            <div>
                              <p className="font-bold">{alertCopy.title}</p>
                              <p className="mt-1 text-sm leading-6">
                                {alertCopy.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-5 space-y-3 text-sm text-slate-700">
                        {table.currentStatus === "WALK_IN_ACTIVE" && table.walkInSession ? (
                          <>
                            <p className="font-semibold">
                              Pelanggan: {table.walkInSession.customerName}
                            </p>

                            {table.walkInSession.customerPhone ? (
                              <p>Telepon: {table.walkInSession.customerPhone}</p>
                            ) : null}

                            <p>
                              Mulai bermain: {formatDateTimeDisplay(table.walkInSession.startedAt)}
                            </p>
                            <p>
                              Perkiraan selesai:{" "}
                              {formatDateTimeDisplay(table.walkInSession.estimatedEndAt)}
                            </p>

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getWalkInPaymentChipClass(
                                table.walkInSession.paymentStatus
                              )}`}
                            >
                              {getWalkInPaymentLabel(table.walkInSession.paymentStatus)}
                            </span>

                            {table.walkInSession.paymentNote ? (
                              <div className="rounded-[1.25rem] bg-white/70 p-3">
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                  Catatan pembayaran
                                </p>
                                <p className="mt-2">{table.walkInSession.paymentNote}</p>
                              </div>
                            ) : null}
                          </>
                        ) : null}

                        {table.currentStatus === "BOOKED_NOW" && table.currentBooking ? (
                          <>
                            <p className="font-semibold">
                              Pelanggan: {table.currentBooking.customerName}
                            </p>
                            <p>Kode booking: {table.currentBooking.bookingCode}</p>
                            <p>
                              Slot aktif: {formatHourLabel(table.currentBooking.slotHour)}
                            </p>
                          </>
                        ) : null}

                        {table.nextBooking ? (
                          <div className="rounded-[1.25rem] bg-white/70 p-3">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                              Jadwal berikutnya
                            </p>
                            <p className="mt-2 font-semibold">
                              {table.nextBooking.customerName}
                            </p>
                            <p>{formatHourLabel(table.nextBooking.slotHour)}</p>
                          </div>
                        ) : null}

                        {table.currentStatus === "FREE" ? (
                          <div className="rounded-[1.25rem] bg-white/70 p-3">
                            <p className="font-semibold text-slate-700">
                              Meja ini sedang kosong dan siap digunakan.
                            </p>
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        {table.currentStatus === "WALK_IN_ACTIVE" && table.walkInSession ? (
                          <button
                            type="button"
                            onClick={() =>
                              openWalkInPage(
                                store.id,
                                store.name,
                                table.id,
                                table.walkInSession?.sessionId,
                                table.walkInSession?.customerName
                              )
                            }
                            className="rounded-2xl bg-[#5D3FD3] px-4 py-2 font-bold text-white"
                          >
                            Lihat sesi walk-in
                          </button>
                        ) : null}

                        {table.currentStatus === "BOOKED_NOW" && table.currentBooking ? (
                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/admin/bookings/${table.currentBooking?.bookingId}`)
                            }
                            className="rounded-2xl bg-green-600 px-4 py-2 font-bold text-white"
                          >
                            Lihat detail booking
                          </button>
                        ) : null}

                        {table.currentStatus === "FREE" ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                openWalkInPage(store.id, store.name, table.id)
                              }
                              className="rounded-2xl bg-[#5D3FD3] px-4 py-2 font-bold text-white"
                            >
                              Buka sesi walk-in
                            </button>

                            <button
                              type="button"
                              onClick={() => router.push("/admin/manual-booking")}
                              className="rounded-2xl border border-slate-300 px-4 py-2 font-bold text-slate-700"
                            >
                              Buat booking manual
                            </button>
                          </>
                        ) : null}

                        {table.currentStatus === "UPCOMING_BOOKING" && table.nextBooking ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                router.push(`/admin/bookings/${table.nextBooking?.bookingId}`)
                              }
                              className="rounded-2xl border border-orange-300 px-4 py-2 font-bold text-orange-700"
                            >
                              Lihat booking berikutnya
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openWalkInPage(store.id, store.name, table.id)
                              }
                              className="rounded-2xl bg-[#5D3FD3] px-4 py-2 font-bold text-white"
                            >
                              Buka sesi walk-in
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}