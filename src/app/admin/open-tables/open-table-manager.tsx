"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { 
    formatDateTimeDisplay, 
    formatDurationMinutes, 
    formatRupiah,
    formatBilledHours
} from "../../../lib/utils";

type StoreItem = {
    id: string;
    name: string;
    tables: {
        id: string;
        tableNumber: number;
        tableCode: string | null;
        capacity: number | null;
    }[];
};

type SessionItem = {
    id: string;
    customerName: string;
    customerPhone: string | null;
    notes: string | null;
    status: string;
    openedAt: Date;
    closedAt: Date | null;
    durationMinutes: number | null;
    billedHours: number | null;
    totalPrice: number | null;
    store: {
        name: string;
    };
    table: {
        tableNumber: number;
    };
};

type OpenTableManagerProps = {
    stores: StoreItem[];
    activeSessions: SessionItem[];
    recentSessions: SessionItem[];
};

export default function OpenTableManager({
    stores,
    activeSessions,
    recentSessions,
}: OpenTableManagerProps) {
    const router = useRouter();

    const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id ?? "");
    const [selectedTableId, setSelectedTableId] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [closingId, setClosingId] = useState<string | null>(null);
    const [message, setMessage] = useState("");

    const selectedStore = useMemo(
        () => stores.find((store) => store.id === selectedStoreId),
        [stores, selectedStoreId]
    );

    const handleOpenTable = async () => {
        if (!selectedStoreId || !selectedTableId || !customerName.trim()) {
            setMessage("Lengkapi store, meja, dan nama customer.");
            return;
        }

        try {
            setIsSubmitting(true);
            setMessage("");

            const response = await fetch("/api/admin/open-table-sessions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    storeId: selectedStoreId,
                    tableId: selectedTableId,
                    customerName,
                    customerPhone,
                    notes,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                setMessage(result.error ?? "Gagal membuka Open Table.");
                return;
            }

            setMessage("Open Table berhasil dibuka.");
            setSelectedTableId("");
            setCustomerName("");
            setCustomerPhone("");
            setNotes("");
            router.refresh();
        } catch (error) {
            console.error(error);
            setMessage("Terjadi kesalahan saat membuka Open Table.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseTable = async (sessionId: string) => {
        const ok = window.confirm("Tutup sesi Open Table ini?");
        if (!ok) return;

        try {
            setClosingId(sessionId);
            setMessage("");

            const response = await fetch(
                `/api/admin/open-table-sessions/${sessionId}/close`,
                {
                    method: "PATCH",
                }
            );

            const result = await response.json();

            if (!response.ok) {
                setMessage(result.error ?? "Gagal menutup Open Table.");
                return;
            }

            setMessage("Open Table berhasil ditutup.");
            router.refresh();
        } catch (error) {
            console.error(error);
            setMessage("Terjadi kesalahan saat menutup Open Table.");
        } finally {
            setClosingId(null);
        }
    };

    return (
        <main className="min-h-screen bg-[var(--tf-bg)] px-6 py-16 text-slate-800">
            <div className="mx-auto max-w-7xl space-y-8">
                <div>
                    <p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
                        Open Table
                    </p>
                    <h1 className="mt-3 text-4xl font-black text-[var(--tf-purple)]">
                        Open Table Mahjong
                    </h1>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-[var(--tf-cream)] px-3 py-1 text-xs font-semibold text-[var(--tf-orange-dark)]">
                            30 menit = Rp 25.000
                        </span>
                        <span className="rounded-full bg-[var(--tf-lavender)] px-3 py-1 text-xs font-semibold text-[var(--tf-purple-dark)]">
                            1 jam = Rp 45.000
                        </span>
                        <p className="text-xs text-slate-500">
                            Open Table hanya bisa dibuka saat jam operasional dan akan memblok meja untuk sisa hari ini.
                        </p>
                    </div>
                </div>

                {message ? (
                    <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-[var(--tf-shadow-card)]">
                        {message}
                    </div>
                ) : null}

                <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
                        <h2 className="text-2xl font-black text-[var(--tf-purple)]">
                            Buka Open Table
                        </h2>

                        <div className="mt-6 space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Store
                                </label>
                                <select
                                    value={selectedStoreId}
                                    onChange={(e) => {
                                        setSelectedStoreId(e.target.value);
                                        setSelectedTableId("");
                                    }}
                                    className="w-full rounded-[1.5rem] border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
                                >
                                    {stores.map((store) => (
                                        <option key={store.id} value={store.id}>
                                            {store.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Meja
                                </label>
                                <select
                                    value={selectedTableId}
                                    onChange={(e) => setSelectedTableId(e.target.value)}
                                    className="w-full rounded-[1.5rem] border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
                                >
                                    <option value="">Pilih meja</option>
                                    {selectedStore?.tables.map((table) => (
                                        <option key={table.id} value={table.id}>
                                            Meja {table.tableNumber}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Nama Customer
                                </label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Contoh: Walk-in 1"
                                    className="w-full rounded-[1.5rem] border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Nomor HP (opsional)
                                </label>
                                <input
                                    type="text"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    placeholder="08xxxxxxxxxx"
                                    className="w-full rounded-[1.5rem] border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Catatan (opsional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={4}
                                    placeholder="Contoh: open table walk-in, cash, dan lain-lain"
                                    className="w-full rounded-[1.5rem] border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={handleOpenTable}
                                disabled={isSubmitting}
                                className="w-full rounded-[1.5rem] bg-[var(--tf-purple)] px-5 py-3 font-bold text-white transition hover:bg-[var(--tf-purple-dark)] disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                                {isSubmitting ? "Membuka..." : "Buka Open Table"}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
                            <h2 className="text-2xl font-black text-[var(--tf-purple)]">
                                Sesi Aktif
                            </h2>

                            <div className="mt-5 space-y-4">
                                {activeSessions.length === 0 ? (
                                    <div className="rounded-[1.5rem] bg-slate-50 p-5 text-sm text-slate-500">
                                        Belum ada Open Table yang sedang aktif.
                                    </div>
                                ) : (
                                    activeSessions.map((session) => (
                                        <div
                                            key={session.id}
                                            className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
                                        >
                                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                                <div>
                                                    <p className="text-lg font-black text-[var(--tf-purple)]">
                                                        {session.customerName}
                                                    </p>
                                                    <p className="mt-1 text-sm text-slate-600">
                                                        {session.store.name} • Meja {session.table.tableNumber}
                                                    </p>
                                                    <p className="mt-1 text-sm text-slate-600">
                                                        Dibuka: {formatDateTimeDisplay(session.openedAt)}
                                                    </p>
                                                    {session.customerPhone ? (
                                                        <p className="mt-1 text-sm text-slate-600">
                                                            HP: {session.customerPhone}
                                                        </p>
                                                    ) : null}
                                                    {session.notes ? (
                                                        <p className="mt-2 text-sm text-slate-600">
                                                            Catatan: {session.notes}
                                                        </p>
                                                    ) : null}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleCloseTable(session.id)}
                                                    disabled={closingId === session.id}
                                                    className="rounded-2xl bg-red-600 px-4 py-2 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                                >
                                                    {closingId === session.id ? "Menutup..." : "Close Table"}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
                            <h2 className="text-2xl font-black text-[var(--tf-purple)]">
                                Riwayat Terbaru
                            </h2>

                            <div className="mt-5 space-y-4">
                                {recentSessions.length === 0 ? (
                                    <div className="rounded-[1.5rem] bg-slate-50 p-5 text-sm text-slate-500">
                                        Belum ada riwayat Open Table.
                                    </div>
                                ) : (
                                    recentSessions.map((session) => (
                                        <div
                                            key={session.id}
                                            className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
                                        >
                                            <p className="text-lg font-black text-[var(--tf-purple)]">
                                                {session.customerName}
                                            </p>
                                            <p className="mt-1 text-sm text-slate-600">
                                                {session.store.name} • Meja {session.table.tableNumber}
                                            </p>
                                            <p className="mt-1 text-sm text-slate-600">
                                                Mulai: {formatDateTimeDisplay(session.openedAt)}
                                            </p>
                                            {session.closedAt ? (
                                                <p className="mt-1 text-sm text-slate-600">
                                                    Selesai: {formatDateTimeDisplay(session.closedAt)}
                                                </p>
                                            ) : null}

                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <span className="rounded-full bg-[var(--tf-lavender)] px-3 py-1 text-xs font-semibold text-[var(--tf-purple-dark)]">
                                                    {formatDurationMinutes(session.durationMinutes)}
                                                </span>
                                                <span className="rounded-full bg-[var(--tf-cream)] px-3 py-1 text-xs font-semibold text-[var(--tf-orange-dark)]">
                                                {formatBilledHours(session.billedHours)} tagihan
                                                </span>
                                                <span className="rounded-full bg-[#eef9d8] px-3 py-1 text-xs font-semibold text-[var(--tf-green-dark)]">
                                                    {formatRupiah(session.totalPrice ?? 0)}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>
                </section>
            </div>
        </main>
    );
}