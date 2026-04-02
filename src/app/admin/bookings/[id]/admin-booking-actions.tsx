"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminBookingActionsProps = {
  bookingId: string;
  status: string;
};

export default function AdminBookingActions({
  bookingId,
  status,
}: AdminBookingActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      setMessage("");

      const response = await fetch(`/api/admin/bookings/${bookingId}/confirm`, {
        method: "PATCH",
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Gagal mengonfirmasi booking.");
        return;
      }

      setMessage("Booking berhasil dikonfirmasi.");
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage("Terjadi kesalahan saat konfirmasi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectProof = async () => {
    const reason =
        window.prompt(
        "Masukkan alasan penolakan bukti pembayaran:",
        "Bukti pembayaran kurang jelas."
        ) || "";

    if (!reason.trim()) {
        return;
    }

    try {
        setIsLoading(true);
        setMessage("");

        const response = await fetch(
        `/api/admin/bookings/${bookingId}/reject-proof`,
        {
            method: "PATCH",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify({ reason }),
        }
        );

        const contentType = response.headers.get("content-type") || "";
        const result = contentType.includes("application/json")
        ? await response.json()
        : { error: `HTTP ${response.status}` };

        if (!response.ok) {
        setMessage(result.error ?? "Gagal menolak bukti pembayaran.");
        return;
        }

        setMessage("Bukti pembayaran berhasil ditolak.");
        router.refresh();
    } catch (error) {
        console.error(error);
        setMessage("Terjadi kesalahan saat menolak bukti.");
    } finally {
        setIsLoading(false);
    }
    };

  const handleCancel = async () => {
    const ok = window.confirm("Yakin ingin membatalkan booking ini?");
    if (!ok) return;

    try {
      setIsLoading(true);
      setMessage("");

      const response = await fetch(`/api/admin/bookings/${bookingId}/cancel`, {
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
      setMessage("Terjadi kesalahan saat cancel.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <h2 className="mb-4 text-xl font-bold text-[#5D3FD3]">Aksi Admin</h2>

      <div className="flex flex-wrap gap-3">
        {status === "PENDING_VERIFICATION" ? (
          <>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className="rounded-2xl bg-green-600 px-5 py-3 font-bold text-white disabled:bg-slate-300"
            >
              {isLoading ? "Memproses..." : "Konfirmasi Pembayaran"}
            </button>

            <button
              type="button"
              onClick={handleRejectProof}
              disabled={isLoading}
              className="rounded-2xl bg-orange-500 px-5 py-3 font-bold text-white disabled:bg-slate-300"
            >
              {isLoading ? "Memproses..." : "Tolak Bukti Pembayaran"}
            </button>
          </>
        ) : null}

        {status !== "CANCELLED" && status !== "EXPIRED" ? (
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="rounded-2xl bg-red-600 px-5 py-3 font-bold text-white disabled:bg-slate-300"
          >
            {isLoading ? "Memproses..." : "Batalkan Booking"}
          </button>
        ) : null}
      </div>

      {message ? (
        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}
    </div>
  );
}