"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type PaymentFinishRedirectCardProps = {
  targetPath?: string;
};

export default function PaymentFinishRedirectCard({
  targetPath = "/my-bookings",
}: PaymentFinishRedirectCardProps) {
  const router = useRouter();
  const hasNavigatedRef = useRef(false);
  const [secondsLeft, setSecondsLeft] = useState(8);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
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
      <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        Kamu akan diarahkan ke halaman <strong>Booking Saya</strong> dalam{" "}
        <strong>{secondsLeft}</strong> detik untuk mengecek status terbaru.
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        Kalau status booking belum berubah saat kamu sampai di sana, tunggu
        beberapa detik lalu refresh halaman booking. Saat testing lokal, pastikan
        <strong> ngrok </strong> dan <strong>npm run dev</strong> masih hidup.
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => router.push(targetPath)}
          className="rounded-2xl bg-[var(--tf-purple)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--tf-purple-dark)]"
        >
          Buka Booking Saya Sekarang
        </button>
      </div>
    </>
  );
}