"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type HeroStoreItem = {
  id: string;
  name: string;
  description: string | null;
  city?: string | null;
  coverImageUrl: string | null;
};

type HeroStoreCarouselProps = {
  stores: HeroStoreItem[];
};

export default function HeroStoreCarousel({
  stores,
}: HeroStoreCarouselProps) {
  const items = useMemo(
    () => stores.filter((store) => Boolean(store.coverImageUrl?.trim())),
    [stores]
  );

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, 4000);

    return () => window.clearInterval(interval);
  }, [items.length]);

  useEffect(() => {
    if (activeIndex > items.length - 1) {
      setActiveIndex(0);
    }
  }, [activeIndex, items.length]);

  if (items.length === 0) {
    return (
      <div className="w-full max-w-[380px] rounded-[1.8rem] border border-white/14 bg-white/10 p-5 backdrop-blur-sm">
        <div className="flex h-64 items-center justify-center rounded-[1.4rem] bg-white/10 text-center text-white/80">
          <div>
            <p className="text-lg font-semibold">Foto store belum tersedia</p>
            <p className="mt-2 text-sm">
              Nanti carousel ini akan otomatis menampilkan cover store yang sudah diisi.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const activeStore = items[activeIndex];

  return (
    <div className="w-full max-w-[380px] rounded-[1.8rem] border border-white/14 bg-white/10 p-5 backdrop-blur-sm">
      <div className="relative h-64 overflow-hidden rounded-[1.4rem]">
        {items.map((store, index) => (
          <div
            key={store.id}
            className={[
              "absolute inset-0 transition-opacity duration-700",
              index === activeIndex ? "opacity-100" : "opacity-0 pointer-events-none",
            ].join(" ")}
          >
            <Image
              src={store.coverImageUrl || "/logo-3frogs.png"}
              alt={store.name}
              fill
              className="object-cover"
              sizes="380px"
              priority={index === 0}
            />
          </div>
        ))}

        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

        <div className="absolute bottom-4 left-4 right-4">
          <div className="rounded-[1rem] bg-black/25 px-4 py-3 backdrop-blur-sm">
            <p className="text-lg font-bold text-white">{activeStore.name}</p>
            <p className="mt-1 text-sm text-white/80">
              {activeStore.city || "Surabaya"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 text-white">
        <p className="text-base leading-7 text-white/82">
          {activeStore.description ||
            "Tempat main untuk mahjong, boardgame, dan momen seru bareng teman."}
        </p>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {items.map((store, index) => (
              <button
                key={store.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Lihat ${store.name}`}
                className={[
                  "h-2.5 rounded-full transition-all",
                  index === activeIndex
                    ? "w-8 bg-[#FFD23F]"
                    : "w-2.5 bg-white/40 hover:bg-white/60",
                ].join(" ")}
              />
            ))}
          </div>

          <Link
            href={{
              pathname: "/reserve",
              query: { store: activeStore.id },
            }}
            className="inline-flex items-center rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-[var(--tf-purple)] transition hover:bg-white/90"
          >
            Reservasi store ini
          </Link>
        </div>
      </div>
    </div>
  );
}