"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PRICE_PER_HOUR } from "../../lib/constants";
import { formatHourLabel, formatRupiah } from "../../lib/utils";

type TableSlot = {
  hour: number;
  isAvailable: boolean;
  reason: "PAST_TIME" | "BOOKED" | null;
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

type AvailabilityTable = {
	id: string;
	tableNumber: number;
	tableCode: string | null;
	capacity: number | null;
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
};

export default function ReserveClient({
	stores,
	defaultDate,
	maxDate,
	currentUser,
}: ReserveClientProps) {
	const router = useRouter();

	const [selectedStoreId, setSelectedStoreId] = useState<string>(
		stores[0]?.id ?? ""
	);
	const [selectedDate, setSelectedDate] = useState(defaultDate);
	const [selectedTableId, setSelectedTableId] = useState<string>("");
	const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
	const [notes, setNotes] = useState("");

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

	const isProfileComplete = Boolean(currentUser.name && currentUser.phone);

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

	const handleSubmitBooking = async () => {
		if (!isProfileComplete) {
			setErrorMessage("Profil kamu belum lengkap. Nama dan nomor HP wajib ada.");
			return;
		}

		if (!selectedStoreId || !selectedDate || !selectedTableId || selectedSlots.length === 0) {
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
		<main className="min-h-[calc(100vh-88px)] bg-[var(--tf-bg)] px-6 py-16 text-slate-800">
			<div className="mx-auto max-w-6xl space-y-10">
				<div>
						<p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
								Reservation
						</p>
						<h1 className="mt-3 text-4xl font-black text-[var(--tf-purple)] md:text-5xl">
								Reservasi Mahjong
						</h1>
						<p className="mt-3 max-w-2xl text-slate-600">
								Pilih store, tentukan tanggal main, pilih meja, lalu booking slot jam favoritmu.
						</p>
				</div>

				<section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
					<div className="space-y-8">
						<div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
							<h2 className="mb-4 text-xl font-bold text-[#5D3FD3]">1. Data Pemesan</h2>

							<div className="grid gap-4 md:grid-cols-2">
								<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
									<p className="text-sm text-slate-500">Nama</p>
									<p className="font-semibold text-slate-800">{currentUser.name || "-"}</p>
								</div>

								<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
									<p className="text-sm text-slate-500">Nomor HP</p>
									<p className="font-semibold text-slate-800">{currentUser.phone || "-"}</p>
								</div>

								<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
									<p className="text-sm text-slate-500">Email</p>
									<p className="font-semibold text-slate-800">{currentUser.email || "Belum diisi"}</p>
								</div>
							</div>

							{!isProfileComplete ? (
								<div className="mt-4 rounded-2xl bg-[var(--tf-cream)] px-4 py-3 text-sm text-[var(--tf-orange-dark)]">
										<p className="font-semibold">
										Profil kamu belum lengkap. Nama dan nomor HP wajib ada sebelum booking.
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

						<div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
							<h2 className="mb-4 text-xl font-bold text-[#5D3FD3]">2. Pilih Store</h2>

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

						<div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
							<h2 className="mb-4 text-xl font-bold text-[#5D3FD3]">3. Pilih Tanggal</h2>

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
								className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#5D3FD3]"
								/>

								<p className="mt-2 text-sm text-slate-500">
								Booking hanya bisa dibuat untuk tanggal {defaultDate} sampai {maxDate}.
								</p>
						</div>

						<div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
							<h2 className="mb-4 text-xl font-bold text-[#5D3FD3]">4. Pilih Meja</h2>

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

						<div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
							<h2 className="mb-4 text-xl font-bold text-[#5D3FD3]">5. Pilih Slot Jam</h2>

							{!selectedTableId ? (
								<p className="text-slate-500">
									Pilih meja dulu supaya slot jam bisa dipilih.
								</p>
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

						<div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
							<h2 className="mb-4 text-xl font-bold text-[#5D3FD3]">6. Catatan Booking</h2>

							<textarea
								placeholder="Contoh: tiles besar, datang terlambat 10 menit, dan lainnya"
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								rows={4}
								className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#5D3FD3]"
							/>
						</div>
					</div>

					<aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
						<div className="mb-5">
							<p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
								Summary
							</p>
							<h2 className="mt-2 text-2xl font-black text-[var(--tf-purple)]">
								Ringkasan Reservasi
							</h2>
						</div>

						<div className="space-y-3 text-sm text-slate-700">
							<div>
								<p className="text-slate-500">Pemesan</p>
								<p className="font-semibold">{currentUser.name || "-"}</p>
							</div>

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
								<p className="text-slate-500">Slot Terpilih</p>
								{selectedSlots.length === 0 ? (
									<p className="font-semibold">-</p>
								) : (
									<ul className="list-inside list-disc space-y-1">
										{selectedSlots.map((hour) => (
											<li key={hour}>{formatHourLabel(hour)}</li>
										))}
									</ul>
								)}
								{selectedSlots.length > 0 ? (
										<div className="rounded-[1.5rem] border border-[var(--tf-green)] bg-[#f6ffe6] p-4">
												<p className="text-sm font-bold text-[var(--tf-green-dark)]">
												Slot Terpilih Sudah Siap
												</p>
												<p className="mt-2 text-sm leading-6 text-slate-700">
												Kamu memilih {selectedSlots.length} jam bermain di{" "}
												{selectedTable ? `Meja ${selectedTable.tableNumber}` : "meja pilihan"}.
												</p>
										</div>
										) : null}
							</div>

							<div>
								<p className="text-slate-500">Durasi</p>
								<p className="font-semibold">{totalHours} jam</p>
							</div>

							<div>
								<p className="text-slate-500">Harga per jam</p>
								<p className="font-semibold">{formatRupiah(PRICE_PER_HOUR)}</p>
							</div>

							<div className="border-t border-slate-200 pt-3">
								<p className="text-slate-500">Total</p>
								<p className="text-2xl font-black text-[#5D3FD3]">
									{formatRupiah(totalPrice)}
								</p>
							</div>
						</div>

						{errorMessage ? (
							<div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
								{errorMessage}
							</div>
						) : null}

						<div className="mt-5 rounded-[1.5rem] bg-[var(--tf-lavender)] p-4">
							<p className="text-sm font-bold text-[var(--tf-purple-dark)]">
								Tips Booking
							</p>
							<p className="mt-2 text-sm leading-6 text-slate-700">
								Pilih slot berurutan untuk pengalaman booking yang lebih cepat dan mudah diproses.
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
							className="mt-6 w-full rounded-2xl bg-[var(--tf-purple)] px-4 py-3 font-bold text-white transition hover:bg-[var(--tf-purple-dark)] disabled:cursor-not-allowed disabled:bg-slate-300"
						>
							{isSubmitting ? "Menyimpan Booking..." : "Buat Booking"}
						</button>

						<div className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
							<p>• Slot abu-abu bisa berarti sudah terisi atau jamnya sudah lewat.</p>
							<p>• Slot yang dipilih harus berurutan.</p>
							<p>• Booking akan di-hold selama 15 menit sambil menunggu pembayaran.</p>
						</div>
					</aside>
				</section>
			</div>
		</main>
	);
}