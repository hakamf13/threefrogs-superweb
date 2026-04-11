"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type StoreSettingsFormProps = {
	store: {
		id: string;
		name: string;
		slug: string;
		city: string | null;
		address: string | null;
		locationHint: string | null;
		description: string | null;
		openingHour: number;
		closingHour: number;
		isActive: boolean;
		coverImageUrl: string | null;
	};
};

export default function StoreSettingsForm({
	store,
}: StoreSettingsFormProps) {
	const router = useRouter();

	const [name, setName] = useState(store.name);
	const [slug, setSlug] = useState(store.slug);
	const [city, setCity] = useState(store.city ?? "");
	const [address, setAddress] = useState(store.address ?? "");
	const [locationHint, setLocationHint] = useState(store.locationHint ?? "");
	const [description, setDescription] = useState(store.description ?? "");
	const [openingHour, setOpeningHour] = useState(store.openingHour);
	const [closingHour, setClosingHour] = useState(store.closingHour);
	const [isActive, setIsActive] = useState(store.isActive);

	const [message, setMessage] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	const handleSave = async () => {
		try {
			setIsSaving(true);
			setMessage("");

			const response = await fetch(`/api/admin/stores/${store.id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name,
					slug,
					city,
					address,
					locationHint,
					description,
					openingHour,
					closingHour,
					isActive,
				}),
			});

			const result = await response.json();

			if (!response.ok) {
				setMessage(result.error ?? "Gagal menyimpan store.");
				return;
			}

			setMessage("Store berhasil diperbarui.");
			router.refresh();
		} catch (error) {
			console.error(error);
			setMessage("Terjadi kesalahan saat menyimpan store.");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
			<h2 className="text-2xl font-black text-[var(--tf-purple)]">
				Store Settings
			</h2>

			<div className="mt-6 space-y-4">
				<div>
					<label className="mb-2 block text-sm font-semibold text-slate-700">
						Nama store
					</label>
					<input
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
					/>
				</div>

				<div>
					<label className="mb-2 block text-sm font-semibold text-slate-700">
						Slug
					</label>
					<input
						value={slug}
						onChange={(e) => setSlug(e.target.value)}
						className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
					/>
				</div>

				<div>
					<label className="mb-2 block text-sm font-semibold text-slate-700">
						Kota
					</label>
					<input
						value={city}
						onChange={(e) => setCity(e.target.value)}
						className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
					/>
				</div>

				<div>
					<label className="mb-2 block text-sm font-semibold text-slate-700">
						Alamat
					</label>
					<textarea
						value={address}
						onChange={(e) => setAddress(e.target.value)}
						rows={3}
						className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
					/>
				</div>

				<div>
					<label className="mb-2 block text-sm font-semibold text-slate-700">
						Petunjuk lokasi
					</label>
					<textarea
						value={locationHint}
						onChange={(e) => setLocationHint(e.target.value)}
						rows={3}
						placeholder="Contoh: dekat eskalator utama, sebelah toko X"
						className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
					/>
				</div>

				<div>
					<label className="mb-2 block text-sm font-semibold text-slate-700">
						Deskripsi singkat
					</label>
					<textarea
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						rows={4}
						className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
					/>
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					<div>
						<label className="mb-2 block text-sm font-semibold text-slate-700">
							Buka jam
						</label>
						<input
							type="number"
							value={openingHour}
							onChange={(e) => setOpeningHour(Number(e.target.value))}
							className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
						/>
					</div>

					<div>
						<label className="mb-2 block text-sm font-semibold text-slate-700">
							Tutup jam
						</label>
						<input
							type="number"
							value={closingHour}
							onChange={(e) => setClosingHour(Number(e.target.value))}
							className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
						/>
					</div>
				</div>

				<label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
					<input
						type="checkbox"
						checked={isActive}
						onChange={(e) => setIsActive(e.target.checked)}
					/>
					Store aktif
				</label>

				{store.coverImageUrl ? (
					<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
						Cover image saat ini sudah tersedia. Penggantian gambar tetap lewat
						halaman Store Images / cover image manager.
					</div>
				) : null}

				{message ? (
					<div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
						{message}
					</div>
				) : null}

				<button
					type="button"
					onClick={handleSave}
					disabled={isSaving}
					className="rounded-2xl bg-[var(--tf-purple)] px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
				>
					{isSaving ? "Menyimpan..." : "Simpan Store"}
				</button>
			</div>
		</section>
	);
}