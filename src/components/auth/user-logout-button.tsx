"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export default function UserLogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await signOut({
        callbackUrl: "/",
      });
    } catch (error) {
      console.error("User logout error:", error);
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
    >
      {isLoading ? "Keluar..." : "Logout"}
    </button>
  );
}