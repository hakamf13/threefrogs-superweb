import Link from "next/link";
import { auth } from "@/auth";
import UserLogoutButton from "@/components/auth/user-logout-button";

export default async function SiteHeader() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--tf-purple)] text-xl shadow-sm">
              🐸
            </div>
            <div>
              <p className="text-2xl font-black leading-none text-[var(--tf-purple-dark)]">
                Threefrogs
              </p>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--tf-orange-dark)]">
                Boardgame & Mahjong
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--tf-purple)] hover:text-[var(--tf-purple)]"
          >
            Beranda
          </Link>

          <Link
            href="/stores"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--tf-purple)] hover:text-[var(--tf-purple)]"
          >
            Store
          </Link>

          <Link
            href="/reserve"
            className="rounded-2xl bg-[var(--tf-purple)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--tf-purple-dark)]"
          >
            Reservasi
          </Link>

          {session?.user ? (
            <>
              <Link
                href="/my-bookings"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--tf-green-dark)] hover:text-[var(--tf-green-dark)]"
              >
                Booking Saya
              </Link>

              {isAdmin ? (
                <Link
                  href="/admin"
                  className="rounded-2xl bg-[var(--tf-orange)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--tf-orange-dark)]"
                >
                  Admin Dashboard
                </Link>
              ) : null}

              <UserLogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--tf-purple)] hover:text-[var(--tf-purple)]"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="rounded-2xl border border-[var(--tf-purple)] px-4 py-2 text-sm font-semibold text-[var(--tf-purple)] transition hover:bg-[var(--tf-lavender)]"
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