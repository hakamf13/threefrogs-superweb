"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type TableItem = {
  id: string;
  tableNumber: number;
  tableCode: string | null;
  displayLabel: string | null;
  capacity: number | null;
  note: string | null;
  isActive: boolean;
};

type TableSettingsManagerProps = {
  storeId: string;
  storeName: string;
  tables: TableItem[];
};

const panelClass =
  "rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]";

export default function TableSettingsManager({
  storeId,
  storeName,
  tables,
}: TableSettingsManagerProps) {
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [newTableNumber, setNewTableNumber] = useState<number>(
    (tables.at(-1)?.tableNumber ?? 0) + 1
  );
  const [newTableCode, setNewTableCode] = useState("");
  const [newDisplayLabel, setNewDisplayLabel] = useState("");
  const [newCapacity, setNewCapacity] = useState<number>(4);
  const [newNote, setNewNote] = useState("");
  const [newIsActive, setNewIsActive] = useState(true);

  const [drafts, setDrafts] = useState<Record<string, TableItem>>(() =>
    Object.fromEntries(tables.map((table) => [table.id, table]))
  );

  const activeCount = useMemo(
    () => tables.filter((table) => table.isActive).length,
    [tables]
  );

  const handleDraftChange = <K extends keyof TableItem>(
    id: string,
    key: K,
    value: TableItem[K]
  ) => {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [key]: value,
      },
    }));
  };

  const handleCreate = async () => {
    try {
      setBusyId("new");
      setMessage("");

      const response = await fetch(`/api/admin/stores/${storeId}/tables`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableNumber: newTableNumber,
          tableCode: newTableCode.trim() || null,
          displayLabel: newDisplayLabel.trim() || null,
          capacity: Number.isFinite(newCapacity) ? newCapacity : null,
          note: newNote.trim() || null,
          isActive: newIsActive,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Gagal menambah meja.");
        return;
      }

      setMessage("Meja baru berhasil ditambahkan.");
      setNewTableNumber((current) => current + 1);
      setNewTableCode("");
      setNewDisplayLabel("");
      setNewCapacity(4);
      setNewNote("");
      setNewIsActive(true);
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage("Terjadi kesalahan saat menambah meja.");
    } finally {
      setBusyId(null);
    }
  };

  const handleSave = async (id: string) => {
    try {
      setBusyId(id);
      setMessage("");

      const draft = drafts[id];

      const response = await fetch(`/api/admin/tables/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableNumber: draft.tableNumber,
          tableCode: draft.tableCode?.trim() || null,
          displayLabel: draft.displayLabel?.trim() || null,
          capacity:
            draft.capacity == null || Number.isNaN(Number(draft.capacity))
              ? null
              : Number(draft.capacity),
          note: draft.note?.trim() || null,
          isActive: draft.isActive,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Gagal menyimpan meja.");
        return;
      }

      setMessage("Data meja berhasil diperbarui.");
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage("Terjadi kesalahan saat menyimpan meja.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
            Table Management
          </p>
          <h2 className="mt-2 text-2xl font-black text-[var(--tf-purple)]">
            Kelola Meja
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {storeName} • {activeCount} meja aktif
          </p>
        </div>
      </div>

      {message ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      <div className="mt-6 rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-lg font-black text-[var(--tf-purple)]">
          Tambah Meja Baru
        </h3>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Nomor meja
            </label>
            <input
              type="number"
              value={newTableNumber}
              onChange={(e) => setNewTableNumber(Number(e.target.value))}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Kode meja
            </label>
            <input
              type="text"
              value={newTableCode}
              onChange={(e) => setNewTableCode(e.target.value)}
              placeholder="Contoh: A1"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Label display
            </label>
            <input
              type="text"
              value={newDisplayLabel}
              onChange={(e) => setNewDisplayLabel(e.target.value)}
              placeholder="Contoh: Meja Ubin Besar"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Kapasitas
            </label>
            <input
              type="number"
              value={newCapacity}
              onChange={(e) => setNewCapacity(Number(e.target.value))}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Catatan meja
            </label>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
            />
          </div>

          <label className="md:col-span-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <input
              type="checkbox"
              checked={newIsActive}
              onChange={(e) => setNewIsActive(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm font-semibold text-slate-800">
              Meja langsung aktif
            </span>
          </label>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          disabled={busyId === "new"}
          className="mt-5 rounded-2xl bg-[var(--tf-purple)] px-5 py-3 font-bold text-white transition hover:bg-[var(--tf-purple-dark)] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {busyId === "new" ? "Menambahkan..." : "Tambah Meja"}
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {tables.map((table) => {
          const draft = drafts[table.id];

          return (
            <div
              key={table.id}
              className="rounded-[1.6rem] border border-slate-200 bg-white p-5"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black text-[var(--tf-purple)]">
                    {draft.displayLabel || `Meja ${draft.tableNumber}`}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {draft.tableCode || "Tanpa kode"}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    draft.isActive
                      ? "bg-green-50 text-green-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {draft.isActive ? "Aktif" : "Nonaktif"}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Nomor meja
                  </label>
                  <input
                    type="number"
                    value={draft.tableNumber}
                    onChange={(e) =>
                      handleDraftChange(
                        table.id,
                        "tableNumber",
                        Number(e.target.value)
                      )
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Kode meja
                  </label>
                  <input
                    type="text"
                    value={draft.tableCode ?? ""}
                    onChange={(e) =>
                      handleDraftChange(table.id, "tableCode", e.target.value)
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Label display
                  </label>
                  <input
                    type="text"
                    value={draft.displayLabel ?? ""}
                    onChange={(e) =>
                      handleDraftChange(table.id, "displayLabel", e.target.value)
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Kapasitas
                  </label>
                  <input
                    type="number"
                    value={draft.capacity ?? ""}
                    onChange={(e) =>
                      handleDraftChange(
                        table.id,
                        "capacity",
                        e.target.value === "" ? null : Number(e.target.value)
                      )
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Catatan meja
                  </label>
                  <textarea
                    value={draft.note ?? ""}
                    onChange={(e) =>
                      handleDraftChange(table.id, "note", e.target.value)
                    }
                    rows={3}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
                  />
                </div>

                <label className="md:col-span-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <input
                    type="checkbox"
                    checked={draft.isActive}
                    onChange={(e) =>
                      handleDraftChange(table.id, "isActive", e.target.checked)
                    }
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-semibold text-slate-800">
                    Meja aktif
                  </span>
                </label>
              </div>

              <button
                type="button"
                onClick={() => handleSave(table.id)}
                disabled={busyId === table.id}
                className="mt-5 rounded-2xl bg-[var(--tf-purple)] px-5 py-3 font-bold text-white transition hover:bg-[var(--tf-purple-dark)] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {busyId === table.id ? "Menyimpan..." : "Simpan Meja"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}