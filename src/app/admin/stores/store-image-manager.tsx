"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type StoreItem = {
	id: string;
	name: string;
	slug: string;
	city: string | null;
	coverImageUrl: string | null;
	coverImagePublicId: string | null;
};

type AdminStoreImageManagerProps = {
	stores: StoreItem[];
};

export default function AdminStoreImageManager({
	stores,
}: AdminStoreImageManagerProps) {
	const router = useRouter();
	const [loadingStoreId, setLoadingStoreId] = useState<string | null>(null);
	const [message, setMessage] = useState("");

	const handleUpload = (storeId: string) => {
		if (!window.cloudinary) {
			setMessage("Cloudinary widget belum siap. Coba refresh halaman.");
			return;
		}

		setMessage("");
		setLoadingStoreId(storeId);

		const widget = window.cloudinary.createUploadWidget(
			{
				cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
				uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
				sources: ["local"],
				multiple: false,
				maxFiles: 1,
				resourceType: "image",
				folder: "threefrogs/store-covers",
				clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
				maxImageFileSize: 5_000_000,
			},
			async (error, result) => {
				if (error) {
					console.error(error);
					setMessage("Upload gambar store gagal.");
					setLoadingStoreId(null);
					return;
				}

				if (result?.event === "success") {
					try {
						const info = result.info as {
							secure_url: string;
							public_id: string;
						};

						const response = await fetch(
							`/api/admin/stores/${storeId}/cover-image`,
							{
								method: "PATCH",
								headers: {
									"Content-Type": "application/json",
								},
								body: JSON.stringify({
									coverImageUrl: info.secure_url,
									coverImagePublicId: info.public_id,
								}),
							}
						);

						const apiResult = await response.json();

						if (!response.ok) {
							setMessage(apiResult.error ?? "Gagal menyimpan cover image.");
							setLoadingStoreId(null);
							return;
						}

						setMessage("Cover image store berhasil diperbarui.");
						setLoadingStoreId(null);
						router.refresh();
					} catch (err) {
						console.error(err);
						setMessage("Upload berhasil, tapi gagal menyimpan ke sistem.");
						setLoadingStoreId(null);
					}
				}

				if (result?.event === "close") {
					setLoadingStoreId(null);
				}
			}
		);

		widget.open();
	};

	return (
		<main className="min-h-screen bg-[var(--tf-bg)] px-6 py-16 text-slate-800">
			<div className="mx-auto max-w-6xl space-y-8">
				<div>
					<p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
						Admin Stores
					</p>
					<h1 className="mt-3 text-4xl font-black text-[var(--tf-purple)]">
						Kelola Foto Store
					</h1>
					<p className="mt-2 text-slate-600">
						Upload cover image utama untuk tiap store. Nanti gambar ini akan tampil
						di homepage dan halaman stores.
					</p>
				</div>

				{message ? (
					<div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-[var(--tf-shadow-card)]">
						{message}
					</div>
				) : null}

				<div className="grid gap-6 md:grid-cols-2">
					{stores.map((store) => (
						<div
							key={store.id}
							className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]"
						>
							{store.coverImageUrl ? (
								<img
									src={store.coverImageUrl}
									alt={store.name}
									className="mb-5 h-52 w-full rounded-[1.5rem] object-cover"
								/>
							) : (
								<div className="mb-5 h-52 rounded-[1.5rem] bg-gradient-to-br from-[var(--tf-lavender)] to-[var(--tf-cream)]" />
							)}

							<h2 className="text-2xl font-black text-[var(--tf-purple)]">
								{store.name}
							</h2>
							<p className="mt-2 text-sm text-slate-600">
								{store.city || "Surabaya"}
							</p>

							<button
								type="button"
								onClick={() => handleUpload(store.id)}
								disabled={loadingStoreId === store.id}
								className="mt-5 rounded-2xl bg-[var(--tf-purple)] px-5 py-3 font-bold text-white transition hover:bg-[var(--tf-purple-dark)] disabled:cursor-not-allowed disabled:bg-slate-300"
							>
								{loadingStoreId === store.id ? "Mengupload..." : "Upload / Ganti Foto"}
							</button>
						</div>
					))}
				</div>
			</div>
		</main>
	);
}