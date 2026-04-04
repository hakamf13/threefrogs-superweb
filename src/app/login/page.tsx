import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import AuthShowcasePanel from "@/components/auth/auth-showcase-panel";
import LoginForm from "./login-form";

type LoginPageProps = {
  searchParams: Promise<{
    registered?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const isRegistered = params.registered === "1";

  return (
    <div className="min-h-screen bg-[var(--tf-bg)] text-slate-800">
      <SiteHeader />

      <main className="px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-[var(--tf-shadow-card)]">
            <div className="mb-8">
              <p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
                Login
              </p>
              <h1 className="mt-3 text-4xl font-black text-[var(--tf-purple)]">
                Welcome back
              </h1>
              <p className="mt-3 text-slate-600">
                Masuk dengan nomor HP atau email untuk lanjut reservasi.
              </p>
            </div>

            {isRegistered ? (
              <div className="mb-5 rounded-[1.5rem] border border-[var(--tf-green)] bg-[#f6ffe6] px-4 py-3 text-sm text-[var(--tf-green-dark)]">
                Register berhasil. Silakan login.
              </div>
            ) : null}

            <LoginForm />
          </div>

          <AuthShowcasePanel mode="login" />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}