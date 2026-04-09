import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import AuthShowcasePanel from "@/components/auth/auth-showcase-panel";
import RegisterForm from "./register-form";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[var(--tf-bg)] text-slate-800">
      <SiteHeader />

      <main className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-[1140px] gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-stretch">
          <AuthShowcasePanel mode="register" />

          <div className="rounded-[1.9rem] border border-[var(--tf-border)] bg-white p-6 shadow-[var(--tf-shadow-card)] sm:p-8">
            <div className="mb-8">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
                Register
              </p>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--tf-purple)] sm:text-4xl">
                Buat akun Threefrogs
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                Nomor HP wajib, email opsional. Setelah punya akun, flow booking
                akan terasa jauh lebih ringkas karena data pemesan bisa langsung
                terisi dari akunmu.
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