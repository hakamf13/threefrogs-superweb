"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function RegisterForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClass =
    "w-full rounded-[1.25rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[var(--tf-purple)] focus:ring-4 focus:ring-[rgba(111,45,189,0.10)]";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !phone.trim() || !password.trim() || !confirmPassword.trim()) {
      setErrorMessage("Nama, nomor HP, password, dan konfirmasi password wajib diisi.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password minimal 8 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Konfirmasi password belum sama.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password,
          confirmPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result.error ?? "Register gagal.");
        return;
      }

      router.push("/login?registered=1");
      router.refresh();
    } catch (error) {
      console.error(error);
      setErrorMessage("Terjadi kesalahan saat register.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Nama
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama lengkap"
          className={inputClass}
          autoComplete="name"
          required
        />
      </div>

      <div>
        <label
          htmlFor="phone"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Nomor HP
        </label>
        <input
          id="phone"
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="08xxxxxxxxxx"
          className={inputClass}
          autoComplete="tel"
          required
        />
        <p className="mt-2 text-xs leading-6 text-slate-500">
          Nomor HP akan jadi identitas utama untuk login dan booking.
        </p>
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Email <span className="text-slate-400">(opsional)</span>
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@kamu.com"
          className={inputClass}
          autoComplete="email"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Password
        </label>

        <div className="relative">
          <input
            id="password"
            type={isPasswordVisible ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 8 karakter"
            className={`${inputClass} pr-12`}
            autoComplete="new-password"
            required
          />

          <button
            type="button"
            onClick={() => setIsPasswordVisible((value) => !value)}
            className="absolute inset-y-0 right-3 inline-flex items-center text-slate-400 transition hover:text-slate-600"
            aria-label={
              isPasswordVisible ? "Sembunyikan password" : "Tampilkan password"
            }
          >
            {isPasswordVisible ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Konfirmasi password
        </label>

        <div className="relative">
          <input
            id="confirmPassword"
            type={isConfirmPasswordVisible ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Ulangi password"
            className={`${inputClass} pr-12`}
            autoComplete="new-password"
            required
          />

          <button
            type="button"
            onClick={() =>
              setIsConfirmPasswordVisible((value) => !value)
            }
            className="absolute inset-y-0 right-3 inline-flex items-center text-slate-400 transition hover:text-slate-600"
            aria-label={
              isConfirmPasswordVisible
                ? "Sembunyikan konfirmasi password"
                : "Tampilkan konfirmasi password"
            }
          >
            {isConfirmPasswordVisible ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-[1.25rem] bg-[var(--tf-purple)] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--tf-purple-dark)] disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Mendaftar...
          </>
        ) : (
          "Daftar"
        )}
      </button>

      <div className="rounded-[1.25rem] bg-[var(--tf-surface-muted)] px-4 py-4 text-sm leading-7 text-slate-600">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="font-semibold text-[var(--tf-purple)] hover:text-[var(--tf-purple-dark)]"
        >
          Login
        </Link>
      </div>
    </form>
  );
}