import RegisterForm from "./register-form";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[#F8F4FF] px-6 py-16 text-slate-800">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm font-semibold text-slate-500">
            Threefrogs
          </p>
          <h1 className="text-3xl font-black text-[#5D3FD3]">Register</h1>
          <p className="mt-2 text-slate-600">
            Buat akun untuk melihat booking kamu nanti.
          </p>
        </div>

        <RegisterForm />
      </div>
    </main>
  );
}