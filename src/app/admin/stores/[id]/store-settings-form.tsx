"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

type OperatingHourItem = {
  dayOfWeek: DayOfWeek;
  openHour: number | null;
  closeHour: number | null;
  isClosed: boolean;
};

type StoreSettingsFormProps = {
  store: {
    id: string;
    name: string;
    slug: string;
    city: string | null;
    address: string | null;
    locationHint: string | null;
    description: string | null;
    openHour: number;
    closeHour: number;
    isActive: boolean;
    coverImageUrl: string | null;
    coverImagePublicId: string | null;
    operatingHours: OperatingHourItem[];
  };
};

const panelClass =
  "rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]";

const DAY_OPTIONS: { value: DayOfWeek; label: string }[] = [
  { value: "MONDAY", label: "Senin" },
  { value: "TUESDAY", label: "Selasa" },
  { value: "WEDNESDAY", label: "Rabu" },
  { value: "THURSDAY", label: "Kamis" },
  { value: "FRIDAY", label: "Jumat" },
  { value: "SATURDAY", label: "Sabtu" },
  { value: "SUNDAY", label: "Minggu" },
];

export default function StoreSettingsForm({ store }: StoreSettingsFormProps) {
  const router = useRouter();

  const [name, setName] = useState(store.name);
  const [slug, setSlug] = useState(store.slug);
  const [city, setCity] = useState(store.city ?? "");
  const [address, setAddress] = useState(store.address ?? "");
  const [locationHint, setLocationHint] = useState(store.locationHint ?? "");
  const [description, setDescription] = useState(store.description ?? "");
  const [openHour, setOpenHour] = useState<number>(store.openHour);
  const [closeHour, setCloseHour] = useState<number>(store.closeHour);
  const [isActive, setIsActive] = useState<boolean>(store.isActive);

  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [operatingHours, setOperatingHours] = useState<OperatingHourItem[]>(
    DAY_OPTIONS.map((day) => {
      const existing = store.operatingHours.find(
        (item) => item.dayOfWeek === day.value
      );

      return {
        dayOfWeek: day.value,
        openHour: existing?.openHour ?? store.openHour,
        closeHour: existing?.closeHour ?? store.closeHour,
        isClosed: existing?.isClosed ?? false,
      };
    })
  );

  const hourOptions = Array.from({ length: 24 }, (_, index) => index);

  const handleHourChange = (
    dayOfWeek: DayOfWeek,
    key: "openHour" | "closeHour" | "isClosed",
    value: number | boolean
  ) => {
    setOperatingHours((current) =>
      current.map((item) =>
        item.dayOfWeek === dayOfWeek
          ? {
              ...item,
              [key]: value,
            }
          : item
      )
    );
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setMessage("");

      const response = await fetch(`/api/admin/stores/${store.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          slug,
          city: city.trim() || null,
          address: address.trim() || null,
          locationHint: locationHint.trim() || null,
          description: description.trim() || null,
          openHour,
          closeHour,
          isActive,
          operatingHours,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Gagal menyimpan data store.");
        return;
      }

      setMessage("Data store berhasil diperbarui.");
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage("Terjadi kesalahan saat menyimpan data store.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadCover = () => {
    if (!window.cloudinary) {
      setMessage("Cloudinary widget belum siap. Coba refresh halaman.");
      return;
    }

    setMessage("");
    setIsUploadingImage(true);

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
        sources: ["local"],
        multiple: false,
        maxFiles: 1,
        resourceType: "image",
        folder: "threefrogs/store-covers",
        clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
        maxImageFileSize: 5_000_000,
      },
      async (error, result) => {
        if (error) {
          console.error(error);
          setMessage("Upload cover image gagal.");
          setIsUploadingImage(false);
          return;
        }

        const uploadResult = result as
          | {
              event?: string;
              info?: {
                secure_url: string;
                public_id: string;
              };
            }
          | undefined;

        if (uploadResult?.event === "success" && uploadResult.info) {
          try {
            const response = await fetch(
              `/api/admin/stores/${store.id}/cover-image`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  coverImageUrl: uploadResult.info.secure_url,
                  coverImagePublicId: uploadResult.info.public_id,
                }),
              }
            );

            const apiResult = await response.json();

            if (!response.ok) {
              setMessage(apiResult.error ?? "Gagal menyimpan cover image.");
              setIsUploadingImage(false);
              return;
            }

            setMessage("Cover image berhasil diperbarui.");
            router.refresh();
          } catch (err) {
            console.error(err);
            setMessage("Upload berhasil, tapi gagal menyimpan ke sistem.");
          } finally {
            setIsUploadingImage(false);
          }
        }

        if (uploadResult?.event === "close") {
          setIsUploadingImage(false);
        }
      }
    );

    widget.open();
  };

  return (
    <section className={panelClass}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
            Store Details
          </p>
          <h2 className="mt-2 text-2xl font-black text-[var(--tf-purple)]">
            Informasi Store
          </h2>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-700"
          }`}
        >
          {isActive ? "Aktif" : "Nonaktif"}
        </span>
      </div>

      {message ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      <div className="mt-6 space-y-5">
        <div>
          {store.coverImageUrl ? (
            <img
              src={store.coverImageUrl}
              alt={store.name}
              className="h-56 w-full rounded-[1.6rem] object-cover"
            />
          ) : (
            <div className="h-56 rounded-[1.6rem] bg-gradient-to-br from-[var(--tf-lavender)] to-[var(--tf-cream)]" />
          )}

          <button
            type="button"
            onClick={handleUploadCover}
            disabled={isUploadingImage}
            className="mt-4 rounded-2xl border border-[var(--tf-purple)] px-4 py-2.5 font-semibold text-[var(--tf-purple)]"
          >
            {isUploadingImage ? "Uploading..." : "Upload Cover Image"}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Nama store
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Kota
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Alamat
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Petunjuk lokasi
            </label>
            <textarea
              value={locationHint}
              onChange={(e) => setLocationHint(e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Deskripsi
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Jam buka default
            </label>
            <select
              value={openHour}
              onChange={(e) => setOpenHour(Number(e.target.value))}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
            >
              {hourOptions.map((hour) => (
                <option key={hour} value={hour}>
                  {String(hour).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Jam tutup default
            </label>
            <select
              value={closeHour}
              onChange={(e) => setCloseHour(Number(e.target.value))}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--tf-purple)]"
            >
              {hourOptions.map((hour) => (
                <option key={hour} value={hour}>
                  {String(hour).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </div>

          <label className="sm:col-span-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4"
            />
            <div>
              <p className="font-semibold text-slate-800">Store aktif</p>
              <p className="text-sm text-slate-500">
                Jika dimatikan, store tidak tampil di flow customer.
              </p>
            </div>
          </label>
        </div>

        <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-lg font-black text-[var(--tf-purple)]">
            Jam Operasional per Hari
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Gunakan ini untuk store dengan jam berbeda antara weekday dan weekend.
          </p>

          <div className="mt-4 space-y-4">
            {DAY_OPTIONS.map((day) => {
              const item = operatingHours.find(
                (entry) => entry.dayOfWeek === day.value
              )!;

              return (
                <div
                  key={day.value}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="grid gap-4 md:grid-cols-[180px_1fr_1fr_auto] md:items-end">
                    <div>
                      <p className="font-semibold text-slate-800">{day.label}</p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Buka
                      </label>
                      <select
                        value={item.openHour ?? openHour}
                        onChange={(e) =>
                          handleHourChange(
                            day.value,
                            "openHour",
                            Number(e.target.value)
                          )
                        }
                        disabled={item.isClosed}
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none disabled:bg-slate-100 focus:border-[var(--tf-purple)]"
                      >
                        {hourOptions.map((hour) => (
                          <option key={hour} value={hour}>
                            {String(hour).padStart(2, "0")}:00
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Tutup
                      </label>
                      <select
                        value={item.closeHour ?? closeHour}
                        onChange={(e) =>
                          handleHourChange(
                            day.value,
                            "closeHour",
                            Number(e.target.value)
                          )
                        }
                        disabled={item.isClosed}
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none disabled:bg-slate-100 focus:border-[var(--tf-purple)]"
                      >
                        {hourOptions.map((hour) => (
                          <option key={hour} value={hour}>
                            {String(hour).padStart(2, "0")}:00
                          </option>
                        ))}
                      </select>
                    </div>

                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={item.isClosed}
                        onChange={(e) =>
                          handleHourChange(day.value, "isClosed", e.target.checked)
                        }
                        className="h-4 w-4"
                      />
                      <span className="text-sm font-semibold text-slate-700">
                        Tutup
                      </span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full rounded-2xl bg-[var(--tf-purple)] px-5 py-3.5 font-bold text-white transition hover:bg-[var(--tf-purple-dark)] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSaving ? "Menyimpan..." : "Simpan Store"}
        </button>
      </div>
    </section>
  );
}