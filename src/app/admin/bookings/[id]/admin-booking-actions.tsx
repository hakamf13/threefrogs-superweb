"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, ShieldCheck, XCircle, TriangleAlert } from "lucide-react";

type AdminBookingActionsProps = {
  bookingId: string;
  status: string;
  paymentGatewayProvider?: string | null;
};

export default function AdminBookingActions({
  bookingId,
  status,
  paymentGatewayProvider,
}: AdminBookingActionsProps) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [directConfirmNote, setDirectConfirmNote] = useState(
    "Booking dikonfirmasi langsung oleh admin."
  );
  const [rejectReason, setRejectReason] = useState(
    "Bukti pembayaran kurang jelas."
  );
  const [showDirectConfirmForm, setShowDirectConfirmForm] = useState(false);
  const [showRejectProofForm, setShowRejectProofForm] = useState(false);

  const isMidtransBooking = paymentGatewayProvider === "MIDTRANS";
  const canDirectConfirm =
    status === "AWAITING_PAYMENT" || status === "PENDING_VERIFICATION";
  const canManualProofReview =
    !isMidtransBooking && status === "PENDING_VERIFICATION";
  const canCancel = status !== "CANCELLED" && status !== "EXPIRED";

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      setMessage("");

      const response = await fetch(`/api/admin/bookings/${bookingId}/confirm`, {
        method: "PATCH",
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Booking belum berhasil dikonfirmasi.");
        return;
      }

      setMessage("Booking berhasil dikonfirmasi.");
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage("Terjadi kendala saat mengonfirmasi booking.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectConfirm = async () => {
    if (!directConfirmNote.trim()) {
      setMessage("Catatan konfirmasi langsung wajib diisi.");
      return;
    }

    try {
      setIsLoading(true);
      setMessage("");

      const response = await fetch(
        `/api/admin/bookings/${bookingId}/confirm-direct`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            note: directConfirmNote.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Booking belum berhasil dikonfirmasi langsung.");
        return;
      }

      setMessage("Booking berhasil dikonfirmasi langsung.");
      setShowDirectConfirmForm(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage("Terjadi kendala saat melakukan konfirmasi langsung.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectProof = async () => {
    if (!rejectReason.trim()) {
      setMessage("Alasan penolakan wajib diisi.");
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
          body: JSON.stringify({
            reason: rejectReason.trim(),
          }),
        }
      );

      const contentType = response.headers.get("content-type") || "";
      const result = contentType.includes("application/json")
        ? await response.json()
        : { error: `HTTP ${response.status}` };

      if (!response.ok) {
        setMessage(result.error ?? "Bukti pembayaran belum berhasil ditolak.");
        return;
      }

      setMessage("Bukti pembayaran berhasil ditolak.");
      setShowRejectProofForm(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage("Terjadi kendala saat menolak bukti pembayaran.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    const ok = window.confirm(
      "Booking ini akan dibatalkan. Kamu yakin ingin melanjutkan?"
    );
    if (!ok) return;

    try {
      setIsLoading(true);
      setMessage("");

      const response = await fetch(`/api/admin/bookings/${bookingId}/cancel`, {
        method: "PATCH",
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Booking belum berhasil dibatalkan.");
        return;
      }

      setMessage("Booking berhasil dibatalkan.");
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage("Terjadi kendala saat membatalkan booking.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)] sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-black text-[var(--tf-purple)]">
            Aksi Admin
          </h2>

          {isMidtransBooking ? (
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Booking ini memakai Midtrans. Dalam kondisi normal, pembayaran akan
              tercatat otomatis lewat webhook sehingga admin biasanya tidak perlu
              memeriksa bukti pembayaran manual.
            </p>
          ) : (
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Booking ini memakai alur manual fallback, jadi admin masih bisa
              meninjau, mengonfirmasi, atau menolak bukti pembayaran bila diperlukan.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[var(--tf-lavender)] px-3 py-1 text-xs font-semibold text-[var(--tf-purple-dark)]">
            {isMidtransBooking ? "Midtrans" : "Manual Fallback"}
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {canDirectConfirm ? (
          <button
            type="button"
            onClick={() => {
              setShowDirectConfirmForm((value) => !value);
              setShowRejectProofForm(false);
              setMessage("");
            }}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <ShieldCheck className="h-4 w-4" />
            Konfirmasi Booking Langsung
          </button>
        ) : null}

        {canManualProofReview ? (
          <>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              Konfirmasi Pembayaran
            </button>

            <button
              type="button"
              onClick={() => {
                setShowRejectProofForm((value) => !value);
                setShowDirectConfirmForm(false);
                setMessage("");
              }}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <XCircle className="h-4 w-4" />
              Tolak Bukti Pembayaran
            </button>
          </>
        ) : null}

        {canCancel ? (
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <TriangleAlert className="h-4 w-4" />
            {isLoading ? "Memproses..." : "Batalkan Booking"}
          </button>
        ) : null}
      </div>

      {showDirectConfirmForm ? (
        <div className="mt-6 rounded-[1.5rem] border border-blue-200 bg-blue-50 p-5">
          <label className="mb-2 block text-sm font-semibold text-blue-800">
            Catatan konfirmasi langsung
          </label>
          <textarea
            value={directConfirmNote}
            onChange={(e) => setDirectConfirmNote(e.target.value)}
            rows={4}
            className="w-full rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400"
          />

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDirectConfirm}
              disabled={isLoading}
              className="rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isLoading ? "Memproses..." : "Simpan Konfirmasi Langsung"}
            </button>

            <button
              type="button"
              onClick={() => setShowDirectConfirmForm(false)}
              disabled={isLoading}
              className="rounded-2xl border border-blue-200 px-5 py-3 font-semibold text-blue-700"
            >
              Batal
            </button>
          </div>
        </div>
      ) : null}

      {showRejectProofForm ? (
        <div className="mt-6 rounded-[1.5rem] border border-orange-200 bg-orange-50 p-5">
          <label className="mb-2 block text-sm font-semibold text-orange-800">
            Alasan penolakan bukti pembayaran
          </label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400"
          />

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRejectProof}
              disabled={isLoading}
              className="rounded-2xl bg-orange-500 px-5 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isLoading ? "Memproses..." : "Simpan Penolakan"}
            </button>

            <button
              type="button"
              onClick={() => setShowRejectProofForm(false)}
              disabled={isLoading}
              className="rounded-2xl border border-orange-200 px-5 py-3 font-semibold text-orange-700"
            >
              Batal
            </button>
          </div>
        </div>
      ) : null}

      {message ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}
    </section>
  );
}