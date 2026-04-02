"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          email,
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
    } catch (error) {
      console.error(error);
      setErrorMessage("Terjadi kesalahan saat register.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Nama
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama lengkap"
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#5D3FD3]"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Nomor HP
        </label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="08xxxxxxxxxx"
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#5D3FD3]"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Email (opsional)
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@kamu.com"
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#5D3FD3]"
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
          placeholder="Minimal 8 karakter"
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#5D3FD3]"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Konfirmasi Password
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Ulangi password"
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
        {isSubmitting ? "Mendaftar..." : "Daftar"}
      </button>

      <p className="text-center text-sm text-slate-600">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-semibold text-[#5D3FD3]">
          Login
        </Link>
      </p>
    </form>
  );
}