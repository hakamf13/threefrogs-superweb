"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type RegenerateMidtransButtonProps = {
  bookingCode: string;
  variant?: "primary" | "secondary";
  label?: string;
};

export default function RegenerateMidtransButton({
  bookingCode,
  variant = "secondary",
  label = "Buat Ulang Link Bayar",
}: RegenerateMidtransButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const buttonClass =
    variant === "primary"
      ? "rounded-2xl bg-[var(--tf-purple)] px-5 py-3 font-bold text-white transition hover:bg-[var(--tf-purple-dark)] disabled:cursor-not-allowed disabled:bg-slate-300"
      : "rounded-2xl border border-[var(--tf-purple)] px-4 py-3 font-semibold text-[var(--tf-purple)] transition hover:bg-[var(--tf-lavender)] disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400";

  const handleRegenerate = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch("/api/payments/midtrans/regenerate-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingCode }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(
          result.error ?? "Link pembayaran belum berhasil dibuat ulang."
        );
        return;
      }

      if (result?.payment?.checkoutUrl) {
        window.open(
          result.payment.checkoutUrl,
          "_blank",
          "noopener,noreferrer"
        );
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      setErrorMessage(
        "Terjadi kendala saat membuat ulang link pembayaran. Coba lagi beberapa saat lagi."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {errorMessage ? (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleRegenerate}
        disabled={isLoading}
        className={buttonClass}
      >
        {isLoading ? "Menyiapkan link..." : label}
      </button>
    </div>
  );
}