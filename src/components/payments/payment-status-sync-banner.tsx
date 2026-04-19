"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type PaymentStatusSyncBannerProps = {
  enabled?: boolean;
};

export default function PaymentStatusSyncBanner({
  enabled = false,
}: PaymentStatusSyncBannerProps) {
  const router = useRouter();
  const refreshedTicksRef = useRef<number[]>([]);
  const [tick, setTick] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(12);
  const [isRunning, setIsRunning] = useState(enabled);

  const refreshSchedule = useMemo(() => [2, 5, 9], []);

  useEffect(() => {
    if (!enabled) return;

    refreshedTicksRef.current = [];
    setTick(0);
    setSecondsLeft(12);
    setIsRunning(true);

    const interval = window.setInterval(() => {
      setTick((prev) => prev + 1);
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    if (tick >= 12) {
      setIsRunning(false);
      return;
    }

    if (
      refreshSchedule.includes(tick) &&
      !refreshedTicksRef.current.includes(tick)
    ) {
      refreshedTicksRef.current.push(tick);
      router.refresh();
    }
  }, [enabled, refreshSchedule, router, tick]);

  if (!enabled) return null;

  return (
    <div className="rounded-[1.6rem] border border-blue-200 bg-blue-50 p-5 text-blue-900 shadow-[var(--tf-shadow-card)]">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
        Payment Sync
      </p>

      <h2 className="mt-2 text-xl font-black">
        Sedang mengecek update pembayaran Midtrans
      </h2>

      <p className="mt-3 text-sm leading-6 text-blue-800">
        Halaman ini akan refresh otomatis beberapa kali untuk menangkap update
        webhook terbaru dari Midtrans.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700">
          {isRunning ? `Auto sync ${secondsLeft} detik` : "Auto sync selesai"}
        </span>

        <button
          type="button"
          onClick={() => router.refresh()}
          className="rounded-2xl border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
        >
          Refresh Sekarang
        </button>
      </div>
    </div>
  );
}