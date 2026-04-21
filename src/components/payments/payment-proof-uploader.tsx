"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PaymentProofUploaderProps = {
  bookingCode: string;
  bookingStatus: string;
  existingProofCount?: number;
};

export default function PaymentProofUploader({
  bookingCode,
  bookingStatus,
  existingProofCount = 0,
}: PaymentProofUploaderProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isReupload =
    bookingStatus === "PENDING_VERIFICATION" || existingProofCount > 0;

  const handleUpload = async () => {
    if (!window.cloudinary) {
      setErrorMessage(
        "Widget upload belum siap. Coba refresh halaman lalu ulangi lagi."
      );
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
        sources: ["local"],
        multiple: false,
        maxFiles: 1,
        resourceType: "image",
        folder: "threefrogs/payment-proofs",
        clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
        maxImageFileSize: 5_000_000,
      },
      async (error, result) => {
        if (error) {
          console.error(error);
          setErrorMessage("Upload belum berhasil. Coba lagi ya.");
          setIsUploading(false);
          return;
        }

        if (result?.event === "upload-added") {
          setIsUploading(true);
        }

        if (result?.event === "success") {
          const info = result.info;

          if (!info || typeof info.secure_url !== "string") {
            setErrorMessage(
              "File berhasil diunggah, tetapi data file belum lengkap."
            );
            setIsUploading(false);
            return;
          }

          try {
            const response = await fetch("/api/upload/payment-proof", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                bookingCode,
                fileUrl: info.secure_url,
                fileName:
                  typeof info.original_filename === "string"
                    ? info.original_filename
                    : null,
                fileSize: typeof info.bytes === "number" ? info.bytes : null,
                mimeType:
                  typeof info.format === "string"
                    ? `image/${info.format}`
                    : "image/*",
              }),
            });

            const apiResult = await response.json();

            if (!response.ok) {
              setErrorMessage(
                apiResult.error ?? "Bukti pembayaran belum berhasil disimpan."
              );
              setIsUploading(false);
              return;
            }

            setSuccessMessage(
              isReupload
                ? "Bukti pembayaran terbaru berhasil dikirim."
                : "Bukti pembayaran berhasil dikirim."
            );
            setIsUploading(false);

            window.setTimeout(() => {
              router.refresh();
            }, 500);
          } catch (err) {
            console.error(err);
            setErrorMessage(
              "File berhasil diunggah, tetapi belum berhasil disimpan ke sistem."
            );
            setIsUploading(false);
          }
        }

        if (result?.event === "close") {
          setIsUploading(false);
        }
      }
    );

    widget.open();
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <h2 className="mb-2 text-xl font-bold text-[#5D3FD3]">
        {isReupload
          ? "Kirim Ulang Bukti Pembayaran"
          : "Kirim Bukti Pembayaran"}
      </h2>

      <p className="text-sm leading-6 text-slate-600">
        Unggah bukti pembayaran yang jelas agar proses pengecekan bisa berjalan
        lebih cepat.
      </p>

      <div className="mt-4 space-y-4">
        {bookingStatus === "PENDING_VERIFICATION" ? (
          <div className="rounded-2xl bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
            Bukti pembayaran sedang diperiksa. Kalau ada file yang ingin
            diperbarui, kamu bisa mengirim ulang dan sistem akan memakai bukti
            terbaru.
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-600">
            {successMessage}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading}
          className="rounded-2xl bg-[#5D3FD3] px-5 py-3 font-bold text-white transition hover:bg-[var(--tf-purple-dark)] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isUploading
            ? "Mengunggah..."
            : isReupload
            ? "Kirim Ulang Bukti"
            : "Kirim Bukti"}
        </button>

        <p className="text-sm text-slate-500">
          Format yang didukung: JPG, PNG, atau WEBP. Ukuran maksimum 5 MB.
        </p>
      </div>
    </div>
  );
}