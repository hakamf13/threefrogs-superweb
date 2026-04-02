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
    <main className="min-h-screen bg-[#F8F4FF] px-6 py-16 text-slate-800">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm font-semibold text-slate-500">
            Threefrogs
          </p>
          <h1 className="text-3xl font-black text-[#5D3FD3]">Login</h1>
          <p className="mt-2 text-slate-600">
            Masuk untuk mengakses dashboard dan booking.
          </p>
        </div>

        {isRegistered ? (
          <div className="mb-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
            Register berhasil. Silakan login.
          </div>
        ) : null}

        <LoginForm />
      </div>
    </main>
  );
}