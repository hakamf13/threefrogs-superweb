"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type PaymentReturnVariant = "finish" | "unfinish" | "error";

type PaymentReturnStatusCardProps = {
	variant: PaymentReturnVariant;
	targetPath?: string;
};

const REDIRECT_SECONDS = 8;

function getContent(variant: PaymentReturnVariant) {
	switch (variant) {
		case "finish":
			return {
				eyebrow: "Status Pembayaran",
				title: "Pembayaran sedang diperiksa",
				description:
					"Kamu sudah kembali dari halaman pembayaran. Status akhir pembayaran akan menyesuaikan hasil yang sudah masuk ke sistem.",
				note:
					"Kalau status booking masih belum berubah saat kamu sampai di halaman berikutnya, tunggu beberapa detik lalu perbarui kembali.",
			};
		case "unfinish":
			return {
				eyebrow: "Status Pembayaran",
				title: "Pembayaran belum selesai",
				description:
					"Proses pembayaran belum diselesaikan. Booking kamu tetap tersimpan, jadi kamu masih bisa melanjutkan pembayaran dari halaman booking.",
				note:
					"Kalau tadi salah memilih metode pembayaran, buka kembali detail booking lalu lanjutkan pembayaran dari sana.",
			};
		case "error":
		default:
			return {
				eyebrow: "Status Pembayaran",
				title: "Terjadi kendala saat pembayaran",
				description:
					"Proses pembayaran belum dapat dipastikan berhasil. Booking kamu belum hilang, tetapi statusnya perlu dicek kembali di halaman booking.",
				note:
					"Kalau pembayaran belum masuk, kamu masih bisa mencoba lagi dari halaman detail booking.",
			};
	}
}

export default function PaymentReturnStatusCard({
	variant,
	targetPath = "/my-bookings?refresh=payment",
}: PaymentReturnStatusCardProps) {
	const router = useRouter();
	const hasNavigatedRef = useRef(false);
	const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

	const content = getContent(variant);

	useEffect(() => {
		const interval = window.setInterval(() => {
			setSecondsLeft((prev) => {
				if (prev <= 1) {
					window.clearInterval(interval);
					return 0;
				}

				return prev - 1;
			});
		}, 1000);

		return () => window.clearInterval(interval);
	}, []);

	useEffect(() => {
		if (secondsLeft !== 0 || hasNavigatedRef.current) return;

		hasNavigatedRef.current = true;
		router.push(targetPath);
	}, [secondsLeft, router, targetPath]);

	return (
		<>
			<p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
				{content.eyebrow}
			</p>

			<h1 className="mt-3 text-3xl font-black text-[var(--tf-purple)]">
				{content.title}
			</h1>

			<p className="mt-4 text-sm leading-7 text-slate-600">
				{content.description}
			</p>

			<div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
				Kamu akan diarahkan ke halaman <strong>Booking Saya</strong> dalam{" "}
				<strong>{secondsLeft}</strong> detik untuk melihat status terbaru.
			</div>

			<div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
				{content.note}
			</div>

			<div className="mt-8 flex flex-wrap gap-3">
				<button
					type="button"
					onClick={() => router.push(targetPath)}
					className="rounded-2xl bg-[var(--tf-purple)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--tf-purple-dark)]"
				>
					Lihat Status Booking
				</button>
			</div>
		</>
	);
}