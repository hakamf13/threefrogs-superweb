"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type TableItem = {
	id: string;
	tableNumber: number;
	tableCode: string | null;
	displayLabel: string | null;
	capacity: number | null;
	notes: string | null;
	// sortOrder: number;
	isActive: boolean;
};

type TableSettingsManagerProps = {
	storeId: string;
	tables: TableItem[];
};

type DraftTableForm = {
	tableNumber: number;
	tableCode: string;
	displayLabel: string;
	capacity: string;
	notes: string;
	// sortOrder: number;
	isActive: boolean;
};

function makeDefaultDraft(nextTableNumber: number): DraftTableForm {
	return {
		tableNumber: nextTableNumber,
		tableCode: "",
		displayLabel: "",
		capacity: "",
		notes: "",
		// sortOrder: 0,
		isActive: true,
	};
}

export default function TableSettingsManager({
	storeId,
	tables,
}: TableSettingsManagerProps) {
	const router = useRouter();

	const [message, setMessage] = useState("");
	const [isCreating, setIsCreating] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);

	const nextTableNumber =
		tables.length > 0
			? Math.max(...tables.map((table) => table.tableNumber)) + 1
			: 1;

	const [newTable, setNewTable] = useState<DraftTableForm>(
		makeDefaultDraft(nextTableNumber)
	);

	const [drafts, setDrafts] = useState<Record<string, DraftTableForm>>(
		Object.fromEntries(
			tables.map((table) => [
				table.id,
				{
					tableNumber: table.tableNumber,
					tableCode: table.tableCode ?? "",
					displayLabel: table.displayLabel ?? "",
					capacity: table.capacity != null ? String(table.capacity) : "",
					notes: table.notes ?? "",
					// sortOrder: table.sortOrder ?? 0,
					isActive: table.isActive,
				},
			])
		)
	);

	const handleCreate = async () => {
		try {
			setIsCreating(true);
			setMessage("");

			const response = await fetch(`/api/admin/stores/${storeId}/tables`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					tableNumber: newTable.tableNumber,
					tableCode: newTable.tableCode,
					displayLabel: newTable.displayLabel,
					capacity: newTable.capacity ? Number(newTable.capacity) : null,
					notes: newTable.notes,
					// sortOrder: newTable.sortOrder,
					isActive: newTable.isActive,
				}),
			});

			const result = await response.json();

			if (!response.ok) {
				setMessage(result.error ?? "Gagal membuat meja.");
				return;
			}

			setMessage("Meja berhasil dibuat.");
			setNewTable(makeDefaultDraft(newTable.tableNumber + 1));
			router.refresh();
		} catch (error) {
			console.error(error);
			setMessage("Terjadi kesalahan saat membuat meja.");
		} finally {
			setIsCreating(false);
		}
	};

	const handleSaveTable = async (tableId: string) => {
		const draft = drafts[tableId];
		if (!draft) return;

		try {
			setMessage("");

			const response = await fetch(`/api/admin/tables/${tableId}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					tableNumber: draft.tableNumber,
					tableCode: draft.tableCode,
					displayLabel: draft.displayLabel,
					capacity: draft.capacity ? Number(draft.capacity) : null,
					notes: draft.notes,
					// sortOrder: draft.sortOrder,
					isActive: draft.isActive,
				}),
			});

			const result = await response.json();

			if (!response.ok) {
				setMessage(result.error ?? "Gagal menyimpan meja.");
				return;
			}

			setMessage("Meja berhasil diperbarui.");
			setEditingId(null);
			router.refresh();
		} catch (error) {
			console.error(error);
			setMessage("Terjadi kesalahan saat menyimpan meja.");
		}
	};

	return (
		<section className="space-y-6">
			<div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
				<h2 className="text-2xl font-black text-[var(--tf-purple)]">
					Tambah Meja Baru
				</h2>

				<div className="mt-6 grid gap-4 md:grid-cols-2">
					<input
						type="number"
						value={newTable.tableNumber}
						onChange={(e) =>
							setNewTable((prev) => ({
								...prev,
								tableNumber: Number(e.target.value),
							}))
						}
						placeholder="Nomor meja"
						className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
					/>

					<input
						value={newTable.displayLabel}
						onChange={(e) =>
							setNewTable((prev) => ({
								...prev,
								displayLabel: e.target.value,
							}))
						}
						placeholder="Display label"
						className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
					/>

					<input
						value={newTable.tableCode}
						onChange={(e) =>
							setNewTable((prev) => ({
								...prev,
								tableCode: e.target.value,
							}))
						}
						placeholder="Table code"
						className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
					/>

					<input
						value={newTable.capacity}
						onChange={(e) =>
							setNewTable((prev) => ({
								...prev,
								capacity: e.target.value,
							}))
						}
						placeholder="Kapasitas"
						className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
					/>

					{/* <input
						type="number"
						value={newTable.sortOrder}
						onChange={(e) =>
							setNewTable((prev) => ({
								...prev,
								sortOrder: Number(e.target.value),
							}))
						}
						placeholder="Urutan"
						className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
					/> */}

					<label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
						<input
							type="checkbox"
							checked={newTable.isActive}
							onChange={(e) =>
								setNewTable((prev) => ({
									...prev,
									isActive: e.target.checked,
								}))
							}
						/>
						Meja aktif
					</label>

					<textarea
						value={newTable.notes}
						onChange={(e) =>
							setNewTable((prev) => ({
								...prev,
								notes: e.target.value,
							}))
						}
						rows={4}
						placeholder="Notes meja: tiles besar, ada bunga, dekat colokan, dst."
						className="md:col-span-2 rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
					/>
				</div>

				<div className="mt-4">
					<button
						type="button"
						onClick={handleCreate}
						disabled={isCreating}
						className="rounded-2xl bg-[var(--tf-purple)] px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
					>
						{isCreating ? "Membuat..." : "Tambah Meja"}
					</button>
				</div>
			</div>

			<div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
				<h2 className="text-2xl font-black text-[var(--tf-purple)]">
					Daftar Meja
				</h2>

				{message ? (
					<div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
						{message}
					</div>
				) : null}

				<div className="mt-6 space-y-4">
					{tables.map((table) => {
						const draft = drafts[table.id];
						const isEditing = editingId === table.id;

						return (
							<div
								key={table.id}
								className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
							>
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div>
										<p className="text-lg font-black text-[var(--tf-purple)]">
											{table.displayLabel || `Meja ${table.tableNumber}`}
										</p>
										<p className="mt-1 text-sm text-slate-500">
											Nomor {table.tableNumber} •{" "}
											{table.isActive ? "Aktif" : "Nonaktif"}
										</p>
									</div>

									<button
										type="button"
										onClick={() =>
											setEditingId((current) =>
												current === table.id ? null : table.id
											)
										}
										className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
									>
										{isEditing ? "Tutup Editor" : "Edit Meja"}
									</button>
								</div>

								{isEditing ? (
									<div className="mt-5 grid gap-4 md:grid-cols-2">
										<input
											type="number"
											value={draft.tableNumber}
											onChange={(e) =>
												setDrafts((prev) => ({
													...prev,
													[table.id]: {
														...prev[table.id],
														tableNumber: Number(e.target.value),
													},
												}))
											}
											placeholder="Nomor meja"
											className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
										/>

										<input
											value={draft.displayLabel}
											onChange={(e) =>
												setDrafts((prev) => ({
													...prev,
													[table.id]: {
														...prev[table.id],
														displayLabel: e.target.value,
													},
												}))
											}
											placeholder="Display label"
											className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
										/>

										<input
											value={draft.tableCode}
											onChange={(e) =>
												setDrafts((prev) => ({
													...prev,
													[table.id]: {
														...prev[table.id],
														tableCode: e.target.value,
													},
												}))
											}
											placeholder="Table code"
											className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
										/>

										<input
											value={draft.capacity}
											onChange={(e) =>
												setDrafts((prev) => ({
													...prev,
													[table.id]: {
														...prev[table.id],
														capacity: e.target.value,
													},
												}))
											}
											placeholder="Kapasitas"
											className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
										/>

										{/* <input
											type="number"
											value={draft.sortOrder}
											onChange={(e) =>
												setDrafts((prev) => ({
													...prev,
													[table.id]: {
														...prev[table.id],
														sortOrder: Number(e.target.value),
													},
												}))
											}
											placeholder="Urutan"
											className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
										/> */}

										<label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
											<input
												type="checkbox"
												checked={draft.isActive}
												onChange={(e) =>
													setDrafts((prev) => ({
														...prev,
														[table.id]: {
															...prev[table.id],
															isActive: e.target.checked,
														},
													}))
												}
											/>
											Meja aktif
										</label>

										<textarea
											value={draft.notes}
											onChange={(e) =>
												setDrafts((prev) => ({
													...prev,
													[table.id]: {
														...prev[table.id],
														notes: e.target.value,
													},
												}))
											}
											rows={4}
											placeholder="Notes meja"
											className="md:col-span-2 rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
										/>

										<div className="md:col-span-2">
											<button
												type="button"
												onClick={() => handleSaveTable(table.id)}
												className="rounded-2xl bg-[var(--tf-purple)] px-5 py-3 font-bold text-white"
											>
												Simpan Meja
											</button>
										</div>
									</div>
								) : (
									<div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600">
										<span className="rounded-full bg-white px-3 py-1">
											Code: {table.tableCode || "-"}
										</span>
										<span className="rounded-full bg-white px-3 py-1">
											Kapasitas: {table.capacity ?? "-"}
										</span>
										{/* <span className="rounded-full bg-white px-3 py-1">
											Urutan: {table.sortOrder ?? 0}
										</span> */}
										{table.notes ? (
											<span className="rounded-full bg-white px-3 py-1">
												{table.notes}
											</span>
										) : null}
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}