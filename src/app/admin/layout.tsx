import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LogoutButton from "@/components/auth/logout-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#F8F4FF] text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/admin" className="text-2xl font-black text-[#5D3FD3]">
              Threefrogs Admin
            </Link>
            <p className="text-sm text-slate-500">
              Login sebagai {session.user.name} ({session.user.email ?? "No Email"})
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/today-operations"
              className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Today Ops
            </Link>

            <Link
              href="/admin/health-check"
              className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Health Check
            </Link>

            <Link
              href="/admin"
              className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Dashboard
            </Link>

            <Link
              href="/admin/bookings"
              className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Semua Booking
            </Link>

            <Link
              href="/admin/manual-booking"
              className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Manual Booking
            </Link>

            <Link
              href="/admin/availability"
              className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Availability
            </Link>

            <Link
              href="/admin/walk-in"
              className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Walk-in
            </Link>

            <Link
              href="/admin/stores"
              className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Store Management
            </Link>

            <LogoutButton />
          </nav>
        </div>
      </header>

      <div>{children}</div>
    </div>
  );
}