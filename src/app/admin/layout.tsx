import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LogoutButton from "@/components/auth/logout-button";
import AdminNavLink from "@/components/admin/admin-nav-link";

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
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link
                href="/admin"
                className="text-2xl font-black text-[#5D3FD3]"
              >
                Threefrogs Admin
              </Link>
              <p className="mt-1 text-sm text-slate-500">
                Login sebagai {session.user.name} (
                {session.user.email ?? "No Email"})
              </p>
            </div>

            <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:overflow-visible lg:pb-0">
              <nav className="inline-flex min-w-max items-center gap-2 rounded-[1.25rem] border border-slate-200 bg-white p-1.5 shadow-sm">
                <AdminNavLink href="/admin/today-operations" label="Today Ops" />
                <AdminNavLink href="/admin/health-check" label="Health Check" />
                <AdminNavLink href="/admin" label="Dashboard" />
                <AdminNavLink href="/admin/manual-booking" label="Manual Booking" />
                <AdminNavLink href="/admin/walk-in" label="Walk-in" />
                <AdminNavLink href="/admin/availability" label="Availability" />
                <AdminNavLink href="/admin/stores" label="Store Management" />
                <LogoutButton />
              </nav>
            </div>
          </div>
        </div>
      </header>

      <div>{children}</div>
    </div>
  );
}