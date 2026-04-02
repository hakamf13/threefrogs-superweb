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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Nomor HP atau Email
          </label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="08xxxxxxxxxx atau email@kamu.com"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#5D3FD3]"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#5D3FD3]"
            required
          />
        </div>

        {errorMessage ? (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-[#5D3FD3] px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? "Masuk..." : "Login"}
        </button>
      </form>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm font-semibold text-slate-800">
          Belum punya akun?
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Daftar dulu supaya booking kamu tersimpan rapi dan bisa dilihat lagi.
        </p>

        <Link
          href="/register"
          className="mt-4 inline-flex rounded-2xl border border-[#5D3FD3] px-4 py-2 font-semibold text-[#5D3FD3]"
        >
          Buat Akun
        </Link>
      </div>
    </div>
  );
}