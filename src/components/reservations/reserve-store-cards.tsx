"use client";

import Image from "next/image";
import { CheckCircle2, ImageOff, MapPin, Navigation } from "lucide-react";

type ReserveStoreCardItem = {
  id: string;
  name: string;
  city?: string | null;
  address?: string | null;
  locationHint?: string | null;
  category?: string | null;
  coverImageUrl?: string | null;
  activeTableCount?: number;
};

type ReserveStoreCardsProps = {
  stores: ReserveStoreCardItem[];
  selectedStoreId?: string | null;
  onSelect: (storeId: string) => void;
};

function getPrimaryLocation(store: ReserveStoreCardItem) {
  return store.address?.trim() || store.city?.trim() || "Surabaya";
}

function getLocationHint(store: ReserveStoreCardItem) {
  return store.locationHint?.trim() || "Info lokasi menyusul.";
}

function getCategoryLabel(category?: string | null) {
  if (!category) return "Mahjong";
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

export default function ReserveStoreCards({
  stores,
  selectedStoreId,
  onSelect,
}: ReserveStoreCardsProps) {
  return (
    <div className="grid items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {stores.map((store) => {
        const isSelected = store.id === selectedStoreId;

        return (
          <button
            key={store.id}
            type="button"
            onClick={() => onSelect(store.id)}
            className="group h-full text-left"
          >
            <article
              className={[
                "flex h-full flex-col overflow-hidden rounded-[26px] border bg-[var(--tf-surface)] shadow-[var(--tf-shadow-card)] transition-all duration-200",
                isSelected
                  ? "border-[var(--tf-purple)] ring-2 ring-[#D9C2FF]"
                  : "border-[var(--tf-border)] hover:-translate-y-0.5 hover:border-[#B794F4] hover:shadow-[0_18px_40px_rgba(110,66,193,0.12)]",
              ].join(" ")}
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-[var(--tf-surface-muted)]">
                {store.coverImageUrl ? (
                  <Image
                    src={store.coverImageUrl}
                    alt={store.name}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--tf-surface-muted)] text-[#9088A8]">
                    <ImageOff className="h-8 w-8" />
                    <p className="mt-3 text-sm font-semibold">
                      Foto store segera hadir
                    </p>
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/25 to-transparent" />

                <div className="absolute right-4 top-4">
                  {isSelected ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--tf-purple)] px-3 py-1 text-xs font-bold text-white shadow-sm">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Dipilih
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[var(--tf-orange-dark)] shadow-sm">
                      Pilih
                    </span>
                  )}
                </div>
              </div>

              <div className="flex min-h-[250px] flex-1 flex-col p-5">
                <div className="min-h-[92px]">
                  <h3 className="text-[24px] font-black leading-[1.08] tracking-tight text-[var(--tf-purple)]">
                    {store.name}
                  </h3>

                  <div className="mt-3 flex items-start gap-2 text-sm text-slate-600">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--tf-purple)]" />
                    <p className="leading-6">{getPrimaryLocation(store)}</p>
                  </div>
                </div>

                <div className="mt-4 min-h-[96px] rounded-2xl bg-[var(--tf-surface-muted)] px-4 py-3">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--tf-purple)]">
                    <Navigation className="h-3.5 w-3.5" />
                    Petunjuk
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {getLocationHint(store)}
                  </p>
                </div>

                <div className="mt-auto flex items-center justify-between pt-5">
                  <span className="inline-flex rounded-full bg-[var(--tf-lavender)] px-3 py-1 text-xs font-bold text-[var(--tf-purple-dark)]">
                    {store.activeTableCount ?? 0} meja aktif
                  </span>

                  <span className="inline-flex rounded-full bg-[var(--tf-cream)] px-3 py-1 text-xs font-bold text-[var(--tf-orange-dark)]">
                    {getCategoryLabel(store.category)}
                  </span>
                </div>
              </div>
            </article>
          </button>
        );
      })}
    </div>
  );
}