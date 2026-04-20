import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LogoutButton from "@/components/auth/logout-button";
import AdminNav from "@/components/admin/admin-nav";

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
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <Link
                  href="/admin"
                  className="text-2xl font-black text-[#5D3FD3]"
                >
                  Threefrogs Admin
                </Link>
                <p className="mt-1 text-sm text-slate-500">
                  Masuk sebagai {session.user.name} (
                  {session.user.email ?? "Email tidak tersedia"})
                </p>
              </div>

              <div className="flex items-center gap-3">
                <LogoutButton />
              </div>
            </div>

            <AdminNav />
          </div>
        </div>
      </header>

      <div>{children}</div>
    </div>
  );
}