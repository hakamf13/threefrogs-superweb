"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CancelBookingButtonProps = {
	bookingCode: string;
	className?: string;
	label?: string;
};

export default function CancelBookingButton({
	bookingCode,
	className,
	label = "Batalkan Booking",
}: CancelBookingButtonProps) {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleCancel() {
		const confirmed = window.confirm(
			"Yakin ingin membatalkan booking ini?"
		);

		if (!confirmed) return;

		setIsSubmitting(true);

		try {
			const response = await fetch(`/api/bookings/${bookingCode}/cancel`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({}),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result?.error || "Gagal membatalkan booking.");
			}

			router.refresh();
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Gagal membatalkan booking.";
			window.alert(message);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<button
			type="button"
			onClick={handleCancel}
			disabled={isSubmitting}
			className={
				className ??
				"rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
			}
		>
			{isSubmitting ? "Membatalkan..." : label}
		</button>
	);
}


