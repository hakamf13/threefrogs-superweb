import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import UserLogoutButton from "@/components/auth/user-logout-button";
import HeaderHomeLink from "@/components/layout/header-home-link";
import HeaderNavLink from "@/components/layout/header-nav-link";

export default async function SiteHeader() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="h-1 w-full bg-[linear-gradient(90deg,#6F2DBD_0%,#5D3FD3_55%,#F6A313_100%)]" />

      <div className="mx-auto max-w-[1140px] px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Link href="/" className="inline-flex items-center self-start">
            <Image
              src="/logo-3frogs.png"
              alt="Threefrogs Mahjong & Boardgame"
              width={230}
              height={72}
              className="h-12 w-auto object-contain sm:h-14"
              priority
            />
          </Link>

          <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:overflow-visible lg:pb-0">
            <nav className="inline-flex min-w-max items-center gap-1.5 rounded-[1.2rem] border border-slate-200 bg-white/85 p-1.5 shadow-sm">
              <HeaderHomeLink className="inline-flex items-center rounded-full px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[var(--tf-lavender)] hover:text-[var(--tf-purple)]" />

              <HeaderNavLink href="/stores" label="Store" />
              <HeaderNavLink href="/reserve" label="Reservasi" />

              {session?.user ? (
                <>
                  <HeaderNavLink href="/profile" label="Profil" />
                  <HeaderNavLink href="/my-bookings" label="Booking Saya" />

                  {isAdmin ? (
                    <Link
                      href="/admin"
                      className="inline-flex items-center rounded-full bg-[var(--tf-orange)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--tf-orange-dark)]"
                    >
                      Admin Dashboard
                    </Link>
                  ) : null}

                  <UserLogoutButton />
                </>
              ) : (
                <>
                  <HeaderNavLink href="/login" label="Login" />

                  <Link
                    href="/register"
                    className="inline-flex items-center rounded-full bg-[var(--tf-purple)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--tf-purple-dark)]"
                  >
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}