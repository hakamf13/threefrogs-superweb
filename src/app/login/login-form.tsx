"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get("callbackUrl") || null;

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const result = await signIn("credentials", {
        identifier,
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
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Nomor HP atau Email
          </label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="08xxxxxxxxxx atau email@kamu.com"
            className="w-full rounded-[1.5rem] border border-slate-300 px-4 py-3 outline-none transition focus:border-[var(--tf-purple)]"
            required
          />
          <p className="mt-2 text-xs text-slate-500">
            Kamu bisa login dengan nomor HP yang terdaftar atau email.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            className="w-full rounded-[1.5rem] border border-slate-300 px-4 py-3 outline-none transition focus:border-[var(--tf-purple)]"
            required
          />
        </div>

        {errorMessage ? (
          <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-[1.5rem] bg-[var(--tf-purple)] px-5 py-3 font-bold text-white transition hover:bg-[var(--tf-purple-dark)] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? "Masuk..." : "Login"}
        </button>
      </form>

      <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm font-bold text-slate-800">Belum punya akun?</p>
        <p className="mt-1 text-sm text-slate-600">
          Daftar dulu supaya booking kamu tersimpan rapi dan bisa dilihat lagi.
        </p>

        <Link
          href="/register"
          className="mt-4 inline-flex rounded-2xl border border-[var(--tf-purple)] px-4 py-2 font-semibold text-[var(--tf-purple)] transition hover:bg-[var(--tf-lavender)]"
        >
          Buat Akun
        </Link>
      </div>

      <div className="text-center text-sm text-slate-500">
        <Link href="/" className="font-semibold text-[var(--tf-purple)] hover:underline">
          Kembali ke beranda
        </Link>
      </div>
    </div>
  );
}