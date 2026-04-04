import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import AuthShowcasePanel from "@/components/auth/auth-showcase-panel";
import RegisterForm from "./register-form";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[var(--tf-bg)] text-slate-800">
      <SiteHeader />

      <main className="px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          <AuthShowcasePanel mode="register" />

          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-[var(--tf-shadow-card)]">
            <div className="mb-8">
              <p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
                Register
              </p>
              <h1 className="mt-3 text-4xl font-black text-[var(--tf-purple)]">
                Buat akun Threefrogs
              </h1>
              <p className="mt-3 text-slate-600">
                Nomor HP wajib, email opsional. Setelah punya akun, flow booking
                akan terasa jauh lebih ringkas.
              </p>
            </div>

            <RegisterForm />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}