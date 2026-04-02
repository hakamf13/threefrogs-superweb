"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (!result || result.error) {
        setErrorMessage("Email atau password salah.");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      console.error(error);
      setErrorMessage("Terjadi kesalahan saat login.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@threefrogs.com"
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
  );
}