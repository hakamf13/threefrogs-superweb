import Link from "next/link";
import { auth } from "@/auth";
import UserLogoutButton from "@/components/auth/user-logout-button";

export default async function SiteHeader() {
  const session = await auth();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/" className="text-2xl font-black text-[#5D3FD3]">
            Threefrogs
          </Link>
          <p className="text-sm text-slate-500">
            Mahjong Reservation System
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Beranda
          </Link>

          <Link
            href="/stores"
            className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Store
          </Link>

          <Link
            href="/reserve"
            className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Reservasi
          </Link>

          {session?.user ? (
            <>
              <Link
                href="/my-bookings"
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Booking Saya
              </Link>

              <UserLogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="rounded-2xl bg-[#5D3FD3] px-4 py-2 text-sm font-semibold text-white"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}