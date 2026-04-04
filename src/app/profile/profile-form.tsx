"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ProfileFormProps = {
	initialProfile: {
		name: string;
		phone: string;
		email: string;
	};
};

export default function ProfileForm({ initialProfile }: ProfileFormProps) {
	const router = useRouter();

	const [name, setName] = useState(initialProfile.name);
	const [phone, setPhone] = useState(initialProfile.phone);
	const [email, setEmail] = useState(initialProfile.email);

	const [errorMessage, setErrorMessage] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		try {
			setIsSubmitting(true);
			setErrorMessage("");
			setSuccessMessage("");

			const response = await fetch("/api/profile", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name,
					phone,
					email,
				}),
			});

			const result = await response.json();

			if (!response.ok) {
				setErrorMessage(result.error ?? "Gagal update profil.");
				return;
			}

			setSuccessMessage("Profil berhasil diperbarui.");
			router.refresh();
		} catch (error) {
			console.error(error);
			setErrorMessage("Terjadi kesalahan saat update profil.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-5">
			<div>
				<label className="mb-2 block text-sm font-semibold text-slate-700">
					Nama
				</label>
				<input
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Nama lengkap"
					className="w-full rounded-[1.5rem] border border-slate-300 px-4 py-3 outline-none transition focus:border-[var(--tf-purple)]"
					required
				/>
			</div>

			<div>
				<label className="mb-2 block text-sm font-semibold text-slate-700">
					Nomor HP
				</label>
				<input
					type="text"
					value={phone}
					onChange={(e) => setPhone(e.target.value)}
					placeholder="08xxxxxxxxxx"
					className="w-full rounded-[1.5rem] border border-slate-300 px-4 py-3 outline-none transition focus:border-[var(--tf-purple)]"
					required
				/>
				<p className="mt-2 text-xs text-slate-500">
					Nomor HP ini akan otomatis dipakai saat booking.
				</p>
			</div>

			<div>
				<label className="mb-2 block text-sm font-semibold text-slate-700">
					Email (opsional)
				</label>
				<input
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="email@kamu.com"
					className="w-full rounded-[1.5rem] border border-slate-300 px-4 py-3 outline-none transition focus:border-[var(--tf-purple)]"
				/>
			</div>

			{errorMessage ? (
				<div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
					{errorMessage}
				</div>
			) : null}

			{successMessage ? (
				<div className="rounded-[1.5rem] border border-[var(--tf-green)] bg-[#f6ffe6] px-4 py-3 text-sm text-[var(--tf-green-dark)]">
					{successMessage}
				</div>
			) : null}

			<div className="flex flex-wrap gap-3">
				<button
					type="submit"
					disabled={isSubmitting}
					className="rounded-[1.5rem] bg-[var(--tf-purple)] px-5 py-3 font-bold text-white transition hover:bg-[var(--tf-purple-dark)] disabled:cursor-not-allowed disabled:bg-slate-300"
				>
					{isSubmitting ? "Menyimpan..." : "Simpan Profil"}
				</button>

				<Link
					href="/reserve"
					className="rounded-[1.5rem] border border-slate-300 px-5 py-3 font-bold text-slate-700"
				>
					Ke Reservasi
				</Link>

				<Link
					href="/my-bookings"
					className="rounded-[1.5rem] border border-slate-300 px-5 py-3 font-bold text-slate-700"
				>
					Booking Saya
				</Link>
			</div>
		</form>
	);
}