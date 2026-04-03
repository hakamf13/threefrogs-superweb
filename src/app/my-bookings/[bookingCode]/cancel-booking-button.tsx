"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CancelBookingButtonProps = {
  bookingCode: string;
};

export default function CancelBookingButton({
  bookingCode,
}: CancelBookingButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleCancel = async () => {
    const ok = window.confirm("Yakin ingin membatalkan booking ini?");
    if (!ok) return;

    try {
      setIsLoading(true);
      setMessage("");

      const response = await fetch(`/api/bookings/${bookingCode}/cancel`, {
        method: "PATCH",
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Gagal membatalkan booking.");
        return;
      }

      setMessage("Booking berhasil dibatalkan.");
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage("Terjadi kesalahan saat membatalkan booking.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleCancel}
        disabled={isLoading}
        className="rounded-2xl bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isLoading ? "Membatalkan..." : "Batalkan Booking"}
      </button>

      {message ? (
        <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}
    </div>
  );
}