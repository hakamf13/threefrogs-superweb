"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type PaymentStatusSyncBannerProps = {
  enabled?: boolean;
};

const AUTO_SYNC_DURATION = 12;

export default function PaymentStatusSyncBanner({
  enabled = false,
}: PaymentStatusSyncBannerProps) {
  const router = useRouter();
  const refreshedTicksRef = useRef<number[]>([]);
  const [tick, setTick] = useState(0);

  const refreshSchedule = useMemo(() => [2, 5, 9], []);
  const secondsLeft = Math.max(AUTO_SYNC_DURATION - tick, 0);
  const isRunning = enabled && tick < AUTO_SYNC_DURATION;

  useEffect(() => {
    if (!enabled) return;

    refreshedTicksRef.current = [];

    const interval = window.setInterval(() => {
      setTick((prev) => {
        if (prev >= AUTO_SYNC_DURATION) {
          window.clearInterval(interval);
          return prev;
        }

        const next = prev + 1;

        if (next >= AUTO_SYNC_DURATION) {
          window.clearInterval(interval);
        }

        return next;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

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
        Sinkronisasi Pembayaran
      </p>

      <h2 className="mt-2 text-xl font-black">
        Sedang memeriksa pembaruan status pembayaran
      </h2>

      <p className="mt-3 text-sm leading-6 text-blue-800">
        Halaman ini akan diperbarui otomatis beberapa kali untuk menangkap
        perubahan status pembayaran terbaru.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700">
          {isRunning
            ? `Pemeriksaan otomatis ${secondsLeft} detik`
            : "Pemeriksaan otomatis selesai"}
        </span>

        <button
          type="button"
          onClick={() => router.refresh()}
          className="rounded-2xl border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
        >
          Perbarui Sekarang
        </button>
      </div>
    </div>
  );
}