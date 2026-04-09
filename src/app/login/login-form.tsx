"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get("callbackUrl") || null;

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClass =
    "w-full rounded-[1.25rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[var(--tf-purple)] focus:ring-4 focus:ring-[rgba(111,45,189,0.10)]";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!identifier.trim() || !password.trim()) {
      setErrorMessage("Nomor HP/email dan password wajib diisi.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const result = await signIn("credentials", {
        identifier: identifier.trim(),
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setErrorMessage("Nomor HP/email atau password salah.");
        return;
      }

      const sessionResponse = await fetch("/api/auth/session");
      const session = await sessionResponse.json();

      const defaultRedirect =
        session?.user?.role === "ADMIN" ? "/admin" : "/";

      router.push(callbackUrl || defaultRedirect);
      router.refresh();
    } catch (error) {
      console.error(error);
      setErrorMessage("Terjadi kesalahan saat login.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="identifier"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Nomor HP atau email
          </label>

          <input
            id="identifier"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="08xxxxxxxxxx atau email@kamu.com"
            className={inputClass}
            autoComplete="username"
            required
          />

          <p className="mt-2 text-xs leading-6 text-slate-500">
            Kamu bisa login dengan nomor HP yang terdaftar atau email.
          </p>
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
              placeholder="Masukkan password"
              className={`${inputClass} pr-12`}
              autoComplete="current-password"
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
              Masuk...
            </>
          ) : (
            "Login"
          )}
        </button>
      </form>

      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm font-bold text-slate-800">Belum punya akun?</p>
        <p className="mt-1 text-sm leading-7 text-slate-600">
          Daftar dulu supaya booking kamu tersimpan rapi dan bisa dilihat lagi.
        </p>

        <Link
          href="/register"
          className="mt-4 inline-flex rounded-2xl border border-[var(--tf-purple)] px-4 py-2 font-semibold text-[var(--tf-purple)] transition hover:bg-[var(--tf-lavender)]"
        >
          Buat akun
        </Link>
      </div>

      <div className="text-center text-sm text-slate-500">
        <Link
          href="/"
          className="font-semibold text-[var(--tf-purple)] hover:underline"
        >
          Kembali ke beranda
        </Link>
      </div>
    </div>
  );
}