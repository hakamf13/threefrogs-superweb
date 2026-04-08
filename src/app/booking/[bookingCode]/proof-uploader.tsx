"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type BookingProofUploaderProps = {
  bookingCode: string;
};

export default function BookingProofUploader({
  bookingCode,
}: BookingProofUploaderProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
                fileSize:
                  typeof info.bytes === "number" ? info.bytes : null,
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

            setSuccessMessage("Bukti pembayaran berhasil diupload.");
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
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <h2 className="mb-4 text-xl font-bold text-[#5D3FD3]">
        Upload Bukti Pembayaran
      </h2>

      <div className="space-y-4">
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
          className="rounded-2xl bg-[#5D3FD3] px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isUploading ? "Mengupload..." : "Upload Bukti"}
        </button>

        <p className="text-sm text-slate-500">
          Format: JPG, PNG, WEBP. Maksimal 5MB.
        </p>
      </div>
    </div>
  );
}