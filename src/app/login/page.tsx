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

      <main className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-[1140px] gap-8 xl:grid-cols-[0.92fr_1.08fr] xl:items-stretch">
          <div className="rounded-[1.9rem] border border-[var(--tf-border)] bg-white p-6 shadow-[var(--tf-shadow-card)] sm:p-8">
            <div className="mb-8">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
                Login
              </p>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--tf-purple)] sm:text-4xl">
                Masuk ke akun Threefrogs
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                Masuk dengan nomor HP atau email untuk lanjut ke reservasi,
                mengecek booking, dan mengelola pesananmu dengan lebih rapi.
              </p>
            </div>

            {isRegistered ? (
              <div className="mb-6 rounded-[1.35rem] border border-[#CFE8A9] bg-[#F7FFE9] px-4 py-3 text-sm text-[var(--tf-green-dark)]">
                Register berhasil. Sekarang kamu bisa langsung login.
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