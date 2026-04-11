"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
	ChevronDown,
	ChevronUp,
	Clock3,
	CreditCard,
	Loader2,
	PlayCircle,
	ReceiptText,
	Store,
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

const durationOptions = [
	{ value: 60, label: "1 jam" },
	{ value: 120, label: "2 jam" },
	{ value: 180, label: "3 jam" },
	{ value: 240, label: "4 jam" },
];

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

function formatShortDateTime(value: string | null) {
	if (!value) return "-";

	return new Intl.DateTimeFormat("id-ID", {
		month: "short",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
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

	if (diffMinutes === 0) return "Berakhir sekarang";
	if (diffMinutes < 0) {
		const overdue = Math.abs(diffMinutes);
		if (overdue < 60) return `Lewat ${overdue}m`;

		const h = Math.floor(overdue / 60);
		const m = overdue % 60;
		return m === 0 ? `Lewat ${h}j` : `Lewat ${h}j ${m}m`;
	}

	if (diffMinutes < 60) return `Sisa ${diffMinutes}m`;

	const hours = Math.floor(diffMinutes / 60);
	const minutes = diffMinutes % 60;

	return minutes === 0 ? `Sisa ${hours}j` : `Sisa ${hours}j ${minutes}m`;
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
	const [showOptionalFields, setShowOptionalFields] = useState(false);

	const [message, setMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [busyId, setBusyId] = useState<string | null>(null);

	const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
	const [editingPaymentStatus, setEditingPaymentStatus] = useState<
		"UNPAID" | "PARTIAL" | "PAID"
	>("UNPAID");
	const [editingPaymentNote, setEditingPaymentNote] = useState("");

	const [closingSessionId, setClosingSessionId] = useState<string | null>(null);
	const [sessionStoreFilter, setSessionStoreFilter] = useState<string>("ALL");

	const selectedStore = useMemo(
		() => stores.find((store) => store.id === selectedStoreId),
		[stores, selectedStoreId]
	);

	const selectedTable = useMemo(
		() => selectedStore?.tables.find((table) => table.id === selectedTableId),
		[selectedStore, selectedTableId]
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

	const sortedActiveSessions = useMemo(() => {
		return [...activeSessions].sort(
			(a, b) =>
				new Date(a.estimatedEndAt).getTime() - new Date(b.estimatedEndAt).getTime()
		);
	}, [activeSessions]);

	const visibleActiveSessions = useMemo(() => {
		if (sessionStoreFilter === "ALL") return sortedActiveSessions;

		return sortedActiveSessions.filter(
			(session) => session.store.name === sessionStoreFilter
		);
	}, [sortedActiveSessions, sessionStoreFilter]);

	const sessionSummary = useMemo(() => {
		const base = visibleActiveSessions;

		return {
			total: base.length,
			unpaid: base.filter((item) => item.paymentStatus === "UNPAID").length,
			partial: base.filter((item) => item.paymentStatus === "PARTIAL").length,
			paid: base.filter((item) => item.paymentStatus === "PAID").length,
			endingSoon: base.filter((item) => {
				const diffMinutes = Math.round(
					(new Date(item.estimatedEndAt).getTime() - Date.now()) / 60000
				);
				return diffMinutes >= 0 && diffMinutes <= 30;
			}).length,
		};
	}, [visibleActiveSessions]);

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

			setMessage("Walk-in berhasil dibuka.");
			setCustomerName("");
			setCustomerPhone("");
			setNotes("");
			setPaymentNote("");
			setPaymentStatus("UNPAID");
			setInitialDurationMinutes(120);
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
		<main className="min-h-screen bg-[var(--tf-bg)] px-4 py-10 text-slate-800 sm:px-6 sm:py-14">
			<div className="mx-auto max-w-7xl space-y-8">
				<div className="space-y-3">
					<p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
						Walk-in Session
					</p>
					<h1 className="text-4xl font-black tracking-tight text-[var(--tf-purple)]">
						Kelola Walk-in
					</h1>
					<p className="max-w-3xl text-slate-600">
						Pantau sesi yang sedang berjalan, buka walk-in baru dengan cepat,
						dan kelola pembayaran tanpa membuat tampilan terasa penuh.
					</p>
				</div>

				{message ? (
					<div className="rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-[var(--tf-shadow-card)]">
						{message}
					</div>
				) : null}

				<div className="grid gap-8 xl:grid-cols-[0.88fr_1.12fr]">
					<section className={panelClass}>
						<div className="flex items-center gap-3">
							<div className="rounded-2xl bg-[var(--tf-lavender)] p-3 text-[var(--tf-purple)]">
								<PlayCircle className="h-5 w-5" />
							</div>
							<div>
								<p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
									Sesi Baru
								</p>
								<h2 className="text-2xl font-black text-[var(--tf-purple)]">
									Buka Walk-in
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
									className="w-full rounded-[1.4rem] border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
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
									className="w-full rounded-[1.4rem] border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
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
									Nama customer
								</label>
								<input
									type="text"
									value={customerName}
									onChange={(e) => setCustomerName(e.target.value)}
									placeholder="Contoh: Walk-in 1"
									className="w-full rounded-[1.4rem] border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
								/>
							</div>

							<div className="grid gap-4 sm:grid-cols-2">
								<div>
									<label className="mb-2 block text-sm font-semibold text-slate-700">
										Mulai main
									</label>
									<input
										type="datetime-local"
										value={startedAtLocal}
										onChange={(e) => setStartedAtLocal(e.target.value)}
										className="w-full rounded-[1.4rem] border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
									/>
								</div>

								<div>
									<label className="mb-2 block text-sm font-semibold text-slate-700">
										Status pembayaran
									</label>
									<select
										value={paymentStatus}
										onChange={(e) =>
											setPaymentStatus(
												e.target.value as "UNPAID" | "PARTIAL" | "PAID"
											)
										}
										className="w-full rounded-[1.4rem] border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
									>
										<option value="UNPAID">Belum bayar</option>
										<option value="PARTIAL">DP</option>
										<option value="PAID">Lunas</option>
									</select>
								</div>
							</div>

							<div>
								<label className="mb-2 block text-sm font-semibold text-slate-700">
									Durasi awal
								</label>
								<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
									{durationOptions.map((option) => {
										const isActive = initialDurationMinutes === option.value;

										return (
											<button
												key={option.value}
												type="button"
												onClick={() => setInitialDurationMinutes(option.value)}
												className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
													isActive
														? "border-[var(--tf-purple)] bg-[var(--tf-lavender)] text-[var(--tf-purple)]"
														: "border-slate-200 bg-white text-slate-700 hover:border-[var(--tf-purple)]"
												}`}
											>
												{option.label}
											</button>
										);
									})}
								</div>
							</div>

							<div className="rounded-[1.4rem] bg-[var(--tf-surface-muted)] p-4">
								<div className="grid gap-3 sm:grid-cols-2">
									<div>
										<p className="text-sm text-slate-500">Meja terpilih</p>
										<p className="mt-1 font-semibold text-slate-900">
											{selectedTable
												? selectedTable.displayLabel ||
													`Meja ${selectedTable.tableNumber}`
												: "-"}
										</p>
									</div>

									<div>
										<p className="text-sm text-slate-500">Estimasi selesai</p>
										<p className="mt-1 font-semibold text-slate-900">
											{estimatedEndPreview}
										</p>
									</div>
								</div>
							</div>

							<button
								type="button"
								onClick={() => setShowOptionalFields((prev) => !prev)}
								className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--tf-purple)]"
							>
								{showOptionalFields ? (
									<>
										<ChevronUp className="h-4 w-4" />
										Sembunyikan detail opsional
									</>
								) : (
									<>
										<ChevronDown className="h-4 w-4" />
										Tampilkan detail opsional
									</>
								)}
							</button>

							{showOptionalFields ? (
								<div className="space-y-4 rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
									<div>
										<label className="mb-2 block text-sm font-semibold text-slate-700">
											Nomor HP
										</label>
										<input
											type="text"
											value={customerPhone}
											onChange={(e) => setCustomerPhone(e.target.value)}
											placeholder="08xxxxxxxxxx"
											className="w-full rounded-[1.4rem] border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
										/>
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
											className="w-full rounded-[1.4rem] border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
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
											placeholder="Contoh: customer minta meja dekat colokan"
											className="w-full rounded-[1.4rem] border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
										/>
									</div>
								</div>
							) : null}

							<button
								type="button"
								onClick={handleCreate}
								disabled={isSubmitting}
								className="inline-flex w-full items-center justify-center gap-2 rounded-[1.4rem] bg-[var(--tf-purple)] px-5 py-3.5 font-bold text-white transition hover:bg-[var(--tf-purple-dark)] disabled:cursor-not-allowed disabled:bg-slate-300"
							>
								{isSubmitting ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										Membuka...
									</>
								) : (
									"Buka Walk-in"
								)}
							</button>
						</div>
					</section>

					<div className="space-y-6">
						<section className={panelClass}>
							<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
								<div className="flex items-center gap-3">
									<div className="rounded-2xl bg-[var(--tf-lavender)] p-3 text-[var(--tf-purple)]">
										<Clock3 className="h-5 w-5" />
									</div>
									<div>
										<p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
											Monitoring
										</p>
										<h2 className="text-2xl font-black text-[var(--tf-purple)]">
											Sesi Aktif
										</h2>
									</div>
								</div>

								<div className="w-full lg:w-[260px]">
									<label className="mb-2 block text-sm font-semibold text-slate-700">
										Filter store
									</label>
									<div className="relative">
										<Store className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
										<select
											value={sessionStoreFilter}
											onChange={(e) => setSessionStoreFilter(e.target.value)}
											className="w-full rounded-[1.4rem] border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-[var(--tf-purple)]"
										>
											<option value="ALL">Semua store</option>
											{stores.map((store) => (
												<option key={store.id} value={store.name}>
													{store.name}
												</option>
											))}
										</select>
									</div>
								</div>
							</div>

							<div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
								<div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-4">
									<p className="text-sm text-slate-500">Aktif</p>
									<p className="mt-2 text-2xl font-black text-[var(--tf-purple)]">
										{sessionSummary.total}
									</p>
								</div>

								<div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-4">
									<p className="text-sm text-slate-500">Belum bayar</p>
									<p className="mt-2 text-2xl font-black text-slate-700">
										{sessionSummary.unpaid}
									</p>
								</div>

								<div className="rounded-[1.3rem] border border-yellow-200 bg-yellow-50 p-4">
									<p className="text-sm text-yellow-700">DP</p>
									<p className="mt-2 text-2xl font-black text-yellow-700">
										{sessionSummary.partial}
									</p>
								</div>

								<div className="rounded-[1.3rem] border border-green-200 bg-green-50 p-4">
									<p className="text-sm text-green-700">Lunas</p>
									<p className="mt-2 text-2xl font-black text-green-700">
										{sessionSummary.paid}
									</p>
								</div>

								<div className="rounded-[1.3rem] border border-orange-200 bg-orange-50 p-4">
									<p className="text-sm text-orange-700">Hampir selesai</p>
									<p className="mt-2 text-2xl font-black text-orange-700">
										{sessionSummary.endingSoon}
									</p>
								</div>
							</div>

							<div className="mt-5 space-y-4">
								{visibleActiveSessions.length === 0 ? (
									<div className="rounded-[1.5rem] bg-slate-50 p-5 text-sm text-slate-500">
										Belum ada walk-in aktif untuk filter ini.
									</div>
								) : (
									visibleActiveSessions.map((session) => {
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
																<p className="mt-1 text-sm text-slate-500">
																	{session.customerPhone}
																</p>
															) : null}
														</div>

														<div className="flex flex-wrap gap-2">
															<span
																className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentBadgeClass(
																	session.paymentStatus
																)}`}
															>
																{getPaymentLabel(session.paymentStatus)}
															</span>

															<span
																className={`rounded-full px-3 py-1 text-xs font-semibold ${getRemainingClass(
																	session.estimatedEndAt
																)}`}
															>
																{getRemainingLabel(session.estimatedEndAt)}
															</span>
														</div>
													</div>

													<div className="grid gap-3 sm:grid-cols-3">
														<div className="rounded-2xl bg-white p-4">
															<p className="text-sm text-slate-500">Mulai</p>
															<p className="mt-1 font-semibold text-slate-900">
																{formatShortDateTime(session.startedAt)}
															</p>
														</div>

														<div className="rounded-2xl bg-white p-4">
															<p className="text-sm text-slate-500">Selesai</p>
															<p className="mt-1 font-semibold text-slate-900">
																{formatShortDateTime(session.estimatedEndAt)}
															</p>
														</div>

														<div className="rounded-2xl bg-white p-4">
															<p className="text-sm text-slate-500">Durasi saat ini</p>
															<p className="mt-1 font-semibold text-slate-900">
																{formatMinutes(
																	Math.max(
																		0,
																		Math.round(
																			(new Date(session.estimatedEndAt).getTime() -
																				new Date(session.startedAt).getTime()) /
																				60000
																		)
																	)
																)}
															</p>
														</div>
													</div>

													{session.paymentNote || session.notes ? (
														<div className="grid gap-3 sm:grid-cols-2">
															{session.paymentNote ? (
																<div className="rounded-2xl bg-white p-4 text-sm text-slate-700">
																	<p className="font-semibold text-slate-900">
																		Catatan pembayaran
																	</p>
																	<p className="mt-1">{session.paymentNote}</p>
																</div>
															) : null}

															{session.notes ? (
																<div className="rounded-2xl bg-white p-4 text-sm text-slate-700">
																	<p className="font-semibold text-slate-900">
																		Catatan sesi
																	</p>
																	<p className="mt-1">{session.notes}</p>
																</div>
															) : null}
														</div>
													) : null}

													<div className="flex flex-wrap gap-3">
														<button
															type="button"
															onClick={() => handleExtend(session.id, 60)}
															disabled={busyId === session.id}
															className="rounded-2xl border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 transition hover:border-[var(--tf-purple)] hover:text-[var(--tf-purple)]"
														>
															+1 jam
														</button>

														<button
															type="button"
															onClick={() => handleExtend(session.id, 120)}
															disabled={busyId === session.id}
															className="rounded-2xl border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 transition hover:border-[var(--tf-purple)] hover:text-[var(--tf-purple)]"
														>
															+2 jam
														</button>

														<button
															type="button"
															onClick={() => handleOpenPaymentEditor(session)}
															disabled={busyId === session.id}
															className="inline-flex items-center gap-2 rounded-2xl border border-[var(--tf-purple)] px-4 py-2.5 font-semibold text-[var(--tf-purple)]"
														>
															<CreditCard className="h-4 w-4" />
															Pembayaran
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
															className="inline-flex items-center gap-2 rounded-2xl border border-red-200 px-4 py-2.5 font-semibold text-red-700 transition hover:bg-red-50"
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
																Sistem akan menghitung durasi real dan total tagihan
																akhir saat sesi ditutup.
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
										Riwayat
									</p>
									<h2 className="text-2xl font-black text-[var(--tf-purple)]">
										Riwayat Hari Ini
									</h2>
								</div>
							</div>

							<div className="mt-5 space-y-3">
								{recentSessions.length === 0 ? (
									<div className="rounded-[1.5rem] bg-slate-50 p-5 text-sm text-slate-500">
										Belum ada riwayat walk-in hari ini.
									</div>
								) : (
									recentSessions.map((session) => (
										<div
											key={session.id}
											className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4"
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
													<p className="mt-1 text-sm text-slate-500">
														{formatShortDateTime(session.startedAt)} –{" "}
														{formatShortDateTime(session.actualEndedAt)}
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
												<span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
													Durasi real: {formatMinutes(session.durationMinutes)}
												</span>
												<span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
													Ditagih: {formatMinutes(session.billedMinutes)}
												</span>
												<span className="rounded-full bg-[var(--tf-lavender)] px-3 py-1 text-xs font-semibold text-[var(--tf-purple-dark)]">
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
				</div>
			</div>
		</main>
	);
}