"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";

type CancelBookingButtonProps = {
  bookingCode: string;
  label?: string;
  disabled?: boolean;
  redirectTo?: string;
  confirmMessage?: string;
};

export default function CancelBookingButton({
  bookingCode,
  label = "Batalkan Booking",
  disabled = false,
  redirectTo,
  confirmMessage = "Booking ini akan dibatalkan. Kamu yakin ingin melanjutkan?",
}: CancelBookingButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleCancel = async () => {
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const response = await fetch(`/api/bookings/${bookingCode}/cancel`, {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(
          result.error ?? "Booking belum berhasil dibatalkan. Coba lagi ya."
        );
        return;
      }

      if (redirectTo) {
        router.push(redirectTo);
        return;
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      setErrorMessage(
        "Terjadi kendala saat membatalkan booking. Coba lagi beberapa saat lagi."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleCancel}
        disabled={disabled || isSubmitting}
        className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Membatalkan booking...
          </>
        ) : (
          <>
            <TriangleAlert className="h-4 w-4" />
            {label}
          </>
        )}
      </button>

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}