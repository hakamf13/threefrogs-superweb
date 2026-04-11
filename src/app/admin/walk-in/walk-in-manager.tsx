"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
	Clock3,
	CreditCard,
	Loader2,
	PlayCircle,
	ReceiptText,
} from "lucide-react";

type StoreItem = {
	id: string;
	name: string;
	tables: {
		id: string;
		tableNumber: number;
		tableCode: string | null;
		displayLabel: string | null;
		capacity: number | null;
	}[];
};

type SessionItem = {
	id: string;
	customerName: string;
	customerPhone: string | null;
	notes: string | null;
	status: string;
	paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
	paymentNote: string | null;
	startedAt: string;
	estimatedEndAt: string;
	actualEndedAt: string | null;
	durationMinutes: number | null;
	billedMinutes: number | null;
	totalPrice: number | null;
	store: {
		name: string;
	};
	table: {
		tableNumber: number;
		displayLabel: string | null;
	};
};

type WalkInManagerProps = {
	stores: StoreItem[];
	activeSessions: SessionItem[];
	recentSessions: SessionItem[];
};

const panelClass =
	"rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]";

function pad(value: number) {
	return String(value).padStart(2, "0");
}

function getNowLocalInputValue() {
	const now = new Date();
	return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
		now.getDate()
	)}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function formatDateTime(value: string | null) {
	if (!value) return "-";

	return new Intl.DateTimeFormat("id-ID", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));
}

function formatCurrency(amount: number | null) {
	if (amount == null) return "-";
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	}).format(amount);
}

function formatMinutes(value: number | null) {
	if (value == null) return "-";
	if (value < 60) return `${value} menit`;

	const hours = Math.floor(value / 60);
	const minutes = value % 60;

	if (minutes === 0) return `${hours} jam`;
	return `${hours} jam ${minutes} menit`;
}

function getPaymentBadgeClass(status: "UNPAID" | "PARTIAL" | "PAID") {
	switch (status) {
		case "PAID":
			return "border border-green-200 bg-green-50 text-green-700";
		case "PARTIAL":
			return "border border-yellow-200 bg-yellow-50 text-yellow-700";
		case "UNPAID":
		default:
			return "border border-slate-200 bg-slate-100 text-slate-700";
	}
}

function getPaymentLabel(status: "UNPAID" | "PARTIAL" | "PAID") {
	switch (status) {
		case "PAID":
			return "Lunas";
		case "PARTIAL":
			return "DP";
		case "UNPAID":
		default:
			return "Belum bayar";
	}
}

function getRemainingLabel(estimatedEndAt: string) {
	const end = new Date(estimatedEndAt).getTime();
	const now = Date.now();
	const diffMinutes = Math.round((end - now) / 60000);

	if (diffMinutes === 0) return "Berakhir sekitar sekarang";
	if (diffMinutes < 0) return `Lewat ${Math.abs(diffMinutes)} menit`;
	if (diffMinutes < 60) return `Sisa ${diffMinutes} menit`;

	const hours = Math.floor(diffMinutes / 60);
	const minutes = diffMinutes % 60;

	if (minutes === 0) return `Sisa ${hours} jam`;
	return `Sisa ${hours} jam ${minutes} menit`;
}

function getRemainingClass(estimatedEndAt: string) {
	const end = new Date(estimatedEndAt).getTime();
	const now = Date.now();
	const diffMinutes = Math.round((end - now) / 60000);

	if (diffMinutes < 0) {
		return "border border-red-200 bg-red-50 text-red-700";
	}

	if (diffMinutes <= 30) {
		return "border border-orange-200 bg-orange-50 text-orange-700";
	}

	return "border border-slate-200 bg-slate-50 text-slate-700";
}

export default function WalkInManager({
	stores,
	activeSessions,
	recentSessions,
}: WalkInManagerProps) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const prefillStoreId = searchParams.get("storeId") ?? stores[0]?.id ?? "";
	const prefillTableId = searchParams.get("tableId") ?? "";
	const prefillHour = searchParams.get("hour");
	const prefillDate = searchParams.get("date");

	const defaultStartedAt = useMemo(() => {
		if (prefillDate && prefillHour) {
			return `${prefillDate}T${String(Number(prefillHour)).padStart(2, "0")}:00`;
		}

		return getNowLocalInputValue();
	}, [prefillDate, prefillHour]);

	const [selectedStoreId, setSelectedStoreId] = useState(prefillStoreId);
	const [selectedTableId, setSelectedTableId] = useState(prefillTableId);
	const [customerName, setCustomerName] = useState("");
	const [customerPhone, setCustomerPhone] = useState("");
	const [notes, setNotes] = useState("");
	const [startedAtLocal, setStartedAtLocal] = useState(defaultStartedAt);
	const [initialDurationMinutes, setInitialDurationMinutes] = useState(120);
	const [paymentStatus, setPaymentStatus] = useState<
		"UNPAID" | "PARTIAL" | "PAID"
	>("UNPAID");
	const [paymentNote, setPaymentNote] = useState("");

	const [message, setMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [busyId, setBusyId] = useState<string | null>(null);

	const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
	const [editingPaymentStatus, setEditingPaymentStatus] = useState<
		"UNPAID" | "PARTIAL" | "PAID"
	>("UNPAID");
	const [editingPaymentNote, setEditingPaymentNote] = useState("");

	const [closingSessionId, setClosingSessionId] = useState<string | null>(null);

	const selectedStore = useMemo(
		() => stores.find((store) => store.id === selectedStoreId),
		[stores, selectedStoreId]
	);

	const estimatedEndPreview = useMemo(() => {
		if (!startedAtLocal) return "-";

		const startedAt = new Date(`${startedAtLocal}:00+07:00`);
		if (Number.isNaN(startedAt.getTime())) return "-";

		const estimatedEnd = new Date(
			startedAt.getTime() + initialDurationMinutes * 60 * 1000
		);

		return formatDateTime(estimatedEnd.toISOString());
	}, [startedAtLocal, initialDurationMinutes]);

	const handleCreate = async () => {
		if (!selectedStoreId || !selectedTableId || !customerName.trim()) {
			setMessage("Lengkapi store, meja, dan nama customer.");
			return;
		}

		try {
			setIsSubmitting(true);
			setMessage("");

			const response = await fetch("/api/admin/walk-in-sessions", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					storeId: selectedStoreId,
					tableId: selectedTableId,
					customerName: customerName.trim(),
					customerPhone: customerPhone.trim() || null,
					notes: notes.trim() || null,
					startedAtLocal,
					initialDurationMinutes,
					paymentStatus,
					paymentNote: paymentNote.trim() || null,
				}),
			});

			const result = await response.json();

			if (!response.ok) {
				setMessage(result.error ?? "Gagal membuat sesi walk-in.");
				return;
			}

			setMessage("Walk-in session berhasil dibuat.");
			setCustomerName("");
			setCustomerPhone("");
			setNotes("");
			setPaymentNote("");
			router.refresh();
		} catch (error) {
			console.error(error);
			setMessage("Terjadi kesalahan saat membuat walk-in.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleExtend = async (id: string, extendMinutes: number) => {
		try {
			setBusyId(id);
			setMessage("");

			const response = await fetch(`/api/admin/walk-in-sessions/${id}/extend`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ extendMinutes }),
			});

			const result = await response.json();

			if (!response.ok) {
				setMessage(result.error ?? "Gagal memperpanjang sesi.");
				return;
			}

			setMessage("Durasi sesi berhasil diperpanjang.");
			router.refresh();
		} catch (error) {
			console.error(error);
			setMessage("Terjadi kesalahan saat extend sesi.");
		} finally {
			setBusyId(null);
		}
	};

	const handleOpenPaymentEditor = (session: SessionItem) => {
		setEditingPaymentId(session.id);
		setEditingPaymentStatus(session.paymentStatus);
		setEditingPaymentNote(session.paymentNote ?? "");
		setClosingSessionId(null);
		setMessage("");
	};

	const handlePayment = async (id: string) => {
		try {
			setBusyId(id);
			setMessage("");

			const response = await fetch(`/api/admin/walk-in-sessions/${id}/payment`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					paymentStatus: editingPaymentStatus,
					paymentNote: editingPaymentNote.trim() || null,
				}),
			});

			const result = await response.json();

			if (!response.ok) {
				setMessage(result.error ?? "Gagal mengubah status pembayaran.");
				return;
			}

			setMessage("Status pembayaran berhasil diperbarui.");
			setEditingPaymentId(null);
			setEditingPaymentNote("");
			router.refresh();
		} catch (error) {
			console.error(error);
			setMessage("Terjadi kesalahan saat update pembayaran.");
		} finally {
			setBusyId(null);
		}
	};

	const handleClose = async (id: string) => {
		try {
			setBusyId(id);
			setMessage("");

			const response = await fetch(`/api/admin/walk-in-sessions/${id}/close`, {
				method: "PATCH",
			});

			const result = await response.json();

			if (!response.ok) {
				setMessage(result.error ?? "Gagal menutup sesi.");
				return;
			}

			setMessage("Sesi walk-in berhasil ditutup.");
			setClosingSessionId(null);
			router.refresh();
		} catch (error) {
			console.error(error);
			setMessage("Terjadi kesalahan saat menutup sesi.");
		} finally {
			setBusyId(null);
		}
	};

	return (
		<main className="min-h-screen bg-[var(--tf-bg)] px-4 py-12 text-slate-800 sm:px-6 sm:py-16">
			<div className="mx-auto max-w-7xl space-y-8">
				<div>
					<p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
						Walk-in Session
					</p>
					<h1 className="mt-3 text-4xl font-black text-[var(--tf-purple)]">
						Kelola Walk-in
					</h1>
					<p className="mt-2 max-w-3xl text-slate-600">
						Gunakan halaman ini untuk customer walk-in yang mulai main di jam
						nyata, misalnya 16.15 sampai 18.15. Ini berbeda dari booking slot
						biasa.
					</p>
				</div>

				{message ? (
					<div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-[var(--tf-shadow-card)]">
						{message}
					</div>
				) : null}

				<section className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
					<div className={panelClass}>
						<div className="flex items-center gap-3">
							<div className="rounded-2xl bg-[var(--tf-lavender)] p-3 text-[var(--tf-purple)]">
								<PlayCircle className="h-5 w-5" />
							</div>
							<div>
								<p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
									New Session
								</p>
								<h2 className="text-2xl font-black text-[var(--tf-purple)]">
									Buka Walk-in Session
								</h2>
							</div>
						</div>

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
											{table.displayLabel || `Meja ${table.tableNumber}`}
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
									Mulai main
								</label>
								<input
									type="datetime-local"
									value={startedAtLocal}
									onChange={(e) => setStartedAtLocal(e.target.value)}
									className="w-full rounded-[1.5rem] border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
								/>
							</div>

							<div>
								<label className="mb-2 block text-sm font-semibold text-slate-700">
									Durasi awal
								</label>
								<select
									value={initialDurationMinutes}
									onChange={(e) => setInitialDurationMinutes(Number(e.target.value))}
									className="w-full rounded-[1.5rem] border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
								>
									<option value={30}>30 menit</option>
									<option value={60}>1 jam</option>
									<option value={90}>1,5 jam</option>
									<option value={120}>2 jam</option>
									<option value={150}>2,5 jam</option>
									<option value={180}>3 jam</option>
								</select>
							</div>

							<div className="rounded-[1.5rem] bg-[var(--tf-surface-muted)] p-4 text-sm text-slate-700">
								<p className="font-semibold text-slate-900">
									Estimasi selesai
								</p>
								<p className="mt-1">{estimatedEndPreview}</p>
							</div>

							<div>
								<label className="mb-2 block text-sm font-semibold text-slate-700">
									Status pembayaran awal
								</label>
								<select
									value={paymentStatus}
									onChange={(e) =>
										setPaymentStatus(
											e.target.value as "UNPAID" | "PARTIAL" | "PAID"
										)
									}
									className="w-full rounded-[1.5rem] border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
								>
									<option value="UNPAID">Belum bayar</option>
									<option value="PARTIAL">DP</option>
									<option value="PAID">Lunas</option>
								</select>
							</div>

							<div>
								<label className="mb-2 block text-sm font-semibold text-slate-700">
									Catatan pembayaran
								</label>
								<textarea
									value={paymentNote}
									onChange={(e) => setPaymentNote(e.target.value)}
									rows={3}
									placeholder="Contoh: DP 50.000"
									className="w-full rounded-[1.5rem] border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
								/>
							</div>

							<div>
								<label className="mb-2 block text-sm font-semibold text-slate-700">
									Catatan sesi
								</label>
								<textarea
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									rows={3}
									placeholder="Contoh: mulai 16.15, meja dekat colokan"
									className="w-full rounded-[1.5rem] border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
								/>
							</div>

							<button
								type="button"
								onClick={handleCreate}
								disabled={isSubmitting}
								className="inline-flex w-full items-center justify-center gap-2 rounded-[1.5rem] bg-[var(--tf-purple)] px-5 py-3 font-bold text-white transition hover:bg-[var(--tf-purple-dark)] disabled:cursor-not-allowed disabled:bg-slate-300"
							>
								{isSubmitting ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										Membuka...
									</>
								) : (
									"Buka Walk-in Session"
								)}
							</button>
						</div>
					</div>

					<div className="space-y-6">
						<section className={panelClass}>
							<div className="flex items-center gap-3">
								<div className="rounded-2xl bg-[var(--tf-lavender)] p-3 text-[var(--tf-purple)]">
									<Clock3 className="h-5 w-5" />
								</div>
								<div>
									<p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
										Active Sessions
									</p>
									<h2 className="text-2xl font-black text-[var(--tf-purple)]">
										Sesi Aktif
									</h2>
								</div>
							</div>

							<div className="mt-5 space-y-4">
								{activeSessions.length === 0 ? (
									<div className="rounded-[1.5rem] bg-slate-50 p-5 text-sm text-slate-500">
										Belum ada walk-in session yang aktif.
									</div>
								) : (
									activeSessions.map((session) => {
										const isEditingPayment = editingPaymentId === session.id;
										const isClosing = closingSessionId === session.id;

										return (
											<div
												key={session.id}
												className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
											>
												<div className="flex flex-col gap-4">
													<div className="flex flex-wrap items-start justify-between gap-3">
														<div>
															<p className="text-lg font-black text-[var(--tf-purple)]">
																{session.customerName}
															</p>
															<p className="mt-1 text-sm text-slate-600">
																{session.store.name} •{" "}
																{session.table.displayLabel ||
																	`Meja ${session.table.tableNumber}`}
															</p>
															{session.customerPhone ? (
																<p className="mt-1 text-sm text-slate-600">
																	HP: {session.customerPhone}
																</p>
															) : null}
														</div>

														<span
															className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentBadgeClass(
																session.paymentStatus
															)}`}
														>
															{getPaymentLabel(session.paymentStatus)}
														</span>
													</div>

													<div className="grid gap-3 sm:grid-cols-3">
														<div className="rounded-2xl bg-white p-4">
															<p className="text-sm text-slate-500">Mulai</p>
															<p className="mt-1 font-semibold">
																{formatDateTime(session.startedAt)}
															</p>
														</div>

														<div className="rounded-2xl bg-white p-4">
															<p className="text-sm text-slate-500">
																Estimasi selesai
															</p>
															<p className="mt-1 font-semibold">
																{formatDateTime(session.estimatedEndAt)}
															</p>
														</div>

														<div
															className={`rounded-2xl p-4 ${getRemainingClass(
																session.estimatedEndAt
															)}`}
														>
															<p className="text-sm">Status waktu</p>
															<p className="mt-1 font-semibold">
																{getRemainingLabel(session.estimatedEndAt)}
															</p>
														</div>
													</div>

													{session.notes ? (
														<div className="rounded-2xl bg-white p-4 text-sm text-slate-700">
															<p className="font-semibold text-slate-900">
																Catatan sesi
															</p>
															<p className="mt-1">{session.notes}</p>
														</div>
													) : null}

													{session.paymentNote ? (
														<div className="rounded-2xl bg-white p-4 text-sm text-slate-700">
															<p className="font-semibold text-slate-900">
																Catatan pembayaran
															</p>
															<p className="mt-1">{session.paymentNote}</p>
														</div>
													) : null}

													<div className="flex flex-wrap gap-3">
														<button
															type="button"
															onClick={() => handleExtend(session.id, 30)}
															disabled={busyId === session.id}
															className="rounded-2xl border border-slate-300 px-4 py-2 font-semibold text-slate-700"
														>
															+30 menit
														</button>

														<button
															type="button"
															onClick={() => handleExtend(session.id, 60)}
															disabled={busyId === session.id}
															className="rounded-2xl border border-slate-300 px-4 py-2 font-semibold text-slate-700"
														>
															+60 menit
														</button>

														<button
															type="button"
															onClick={() => handleOpenPaymentEditor(session)}
															disabled={busyId === session.id}
															className="inline-flex items-center gap-2 rounded-2xl border border-[var(--tf-purple)] px-4 py-2 font-semibold text-[var(--tf-purple)]"
														>
															<CreditCard className="h-4 w-4" />
															Ubah pembayaran
														</button>

														<button
															type="button"
															onClick={() => {
																setClosingSessionId(
																	closingSessionId === session.id ? null : session.id
																);
																setEditingPaymentId(null);
																setMessage("");
															}}
															disabled={busyId === session.id}
															className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
														>
															<ReceiptText className="h-4 w-4" />
															Tutup sesi
														</button>
													</div>

													{isEditingPayment ? (
														<div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
															<h3 className="text-lg font-black text-[var(--tf-purple)]">
																Update Pembayaran
															</h3>

															<div className="mt-4 grid gap-4">
																<div>
																	<label className="mb-2 block text-sm font-semibold text-slate-700">
																		Status pembayaran
																	</label>
																	<select
																		value={editingPaymentStatus}
																		onChange={(e) =>
																			setEditingPaymentStatus(
																				e.target.value as
																					| "UNPAID"
																					| "PARTIAL"
																					| "PAID"
																			)
																		}
																		className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
																	>
																		<option value="UNPAID">Belum bayar</option>
																		<option value="PARTIAL">DP</option>
																		<option value="PAID">Lunas</option>
																	</select>
																</div>

																<div>
																	<label className="mb-2 block text-sm font-semibold text-slate-700">
																		Catatan pembayaran
																	</label>
																	<textarea
																		value={editingPaymentNote}
																		onChange={(e) =>
																			setEditingPaymentNote(e.target.value)
																		}
																		rows={3}
																		placeholder="Contoh: DP 100.000 / sisa di akhir"
																		className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
																	/>
																</div>

																<div className="flex flex-wrap gap-3">
																	<button
																		type="button"
																		onClick={() => handlePayment(session.id)}
																		disabled={busyId === session.id}
																		className="rounded-2xl bg-[var(--tf-purple)] px-4 py-3 font-semibold text-white"
																	>
																		{busyId === session.id
																			? "Menyimpan..."
																			: "Simpan perubahan"}
																	</button>

																	<button
																		type="button"
																		onClick={() => {
																			setEditingPaymentId(null);
																			setEditingPaymentNote("");
																		}}
																		disabled={busyId === session.id}
																		className="rounded-2xl border border-slate-300 px-4 py-3 font-semibold text-slate-700"
																	>
																		Batal
																	</button>
																</div>
															</div>
														</div>
													) : null}

													{isClosing ? (
														<div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-4">
															<p className="font-semibold text-red-800">
																Tutup sesi ini sekarang?
															</p>
															<p className="mt-2 text-sm leading-6 text-red-700">
																Sistem akan menghitung durasi real, pembulatan
																billing, lalu menyimpan total tagihan.
															</p>

															<div className="mt-4 flex flex-wrap gap-3">
																<button
																	type="button"
																	onClick={() => handleClose(session.id)}
																	disabled={busyId === session.id}
																	className="rounded-2xl bg-red-600 px-4 py-3 font-semibold text-white"
																>
																	{busyId === session.id
																		? "Menutup..."
																		: "Ya, tutup sesi"}
																</button>

																<button
																	type="button"
																	onClick={() => setClosingSessionId(null)}
																	disabled={busyId === session.id}
																	className="rounded-2xl border border-red-200 px-4 py-3 font-semibold text-red-700"
																>
																	Batal
																</button>
															</div>
														</div>
													) : null}
												</div>
											</div>
										);
									})
								)}
							</div>
						</section>

						<section className={panelClass}>
							<div className="flex items-center gap-3">
								<div className="rounded-2xl bg-[var(--tf-lavender)] p-3 text-[var(--tf-purple)]">
									<ReceiptText className="h-5 w-5" />
								</div>
								<div>
									<p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
										Today History
									</p>
									<h2 className="text-2xl font-black text-[var(--tf-purple)]">
										Riwayat Hari Ini
									</h2>
								</div>
							</div>

							<div className="mt-5 space-y-4">
								{recentSessions.length === 0 ? (
									<div className="rounded-[1.5rem] bg-slate-50 p-5 text-sm text-slate-500">
										Belum ada riwayat walk-in hari ini.
									</div>
								) : (
									recentSessions.map((session) => (
										<div
											key={session.id}
											className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
										>
											<div className="flex flex-wrap items-start justify-between gap-3">
												<div>
													<p className="font-bold text-slate-900">
														{session.customerName}
													</p>
													<p className="mt-1 text-sm text-slate-600">
														{session.store.name} •{" "}
														{session.table.displayLabel ||
															`Meja ${session.table.tableNumber}`}
													</p>
													<p className="mt-1 text-sm text-slate-600">
														{formatDateTime(session.startedAt)} sampai{" "}
														{formatDateTime(session.actualEndedAt)}
													</p>
												</div>

												<span
													className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentBadgeClass(
														session.paymentStatus
													)}`}
												>
													{getPaymentLabel(session.paymentStatus)}
												</span>
											</div>

											<div className="mt-3 flex flex-wrap gap-2">
												<span className="rounded-full bg-[var(--tf-lavender)] px-3 py-1 text-xs font-semibold text-[var(--tf-purple-dark)]">
													Durasi real: {formatMinutes(session.durationMinutes)}
												</span>
												<span className="rounded-full bg-[var(--tf-cream)] px-3 py-1 text-xs font-semibold text-[var(--tf-orange-dark)]">
													Ditagih: {formatMinutes(session.billedMinutes)}
												</span>
												<span className="rounded-full bg-[#eef9d8] px-3 py-1 text-xs font-semibold text-[var(--tf-green-dark)]">
													{formatCurrency(session.totalPrice)}
												</span>
											</div>

											{session.paymentNote ? (
												<p className="mt-3 text-sm text-slate-600">
													Catatan: {session.paymentNote}
												</p>
											) : null}
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