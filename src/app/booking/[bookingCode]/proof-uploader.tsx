"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, UploadCloud } from "lucide-react";

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
      setErrorMessage("Cloudinary widget belum siap. Coba refresh halaman.");
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
          setErrorMessage("Upload gagal. Coba lagi ya.");
          setIsUploading(false);
          return;
        }

        if (result?.event === "upload-added") {
          setIsUploading(true);
        }

        if (result?.event === "success") {
          const info = result.info;

          if (!info || typeof info.secure_url !== "string") {
            setErrorMessage("Upload berhasil, tapi data file tidak lengkap.");
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
                apiResult.error ?? "Gagal menyimpan bukti pembayaran."
              );
              setIsUploading(false);
              return;
            }

            setSuccessMessage(
              isReupload
                ? "Bukti pembayaran berhasil diupload ulang."
                : "Bukti pembayaran berhasil diupload."
            );
            setIsUploading(false);
            router.refresh();
          } catch (err) {
            console.error(err);
            setErrorMessage("Upload berhasil, tapi gagal menyimpan ke sistem.");
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
    <div className="rounded-[1.75rem] border border-[var(--tf-border)] bg-[var(--tf-surface-muted)] p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-white p-3 text-[var(--tf-purple)] shadow-sm">
          <UploadCloud className="h-5 w-5" />
        </div>

        <div>
          <p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
            Payment Proof
          </p>
          <h3 className="text-xl font-black text-[var(--tf-purple)]">
            {isReupload
              ? "Upload Ulang Bukti Pembayaran"
              : "Upload Bukti Pembayaran"}
          </h3>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {bookingStatus === "PENDING_VERIFICATION" ? (
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            Bukti pembayaran sedang diperiksa. Kalau ada yang salah atau kurang
            jelas, kamu bisa upload ulang. Sistem akan memakai bukti terbaru.
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{successMessage}</p>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--tf-purple)] px-5 py-3 font-bold text-white transition hover:bg-[var(--tf-purple-dark)] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Mengupload...
            </>
          ) : isReupload ? (
            "Upload Ulang Bukti"
          ) : (
            "Upload Bukti"
          )}
        </button>

        <p className="text-sm text-slate-500">
          Format: JPG, PNG, WEBP. Maksimal 5MB.
        </p>
      </div>
    </div>
  );
}