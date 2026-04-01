export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F8F4FF] text-slate-800">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 rounded-3xl bg-yellow-400 px-4 py-2 text-sm font-bold text-[#5D3FD3]">
          Threefrogs Mahjong Reservation System
        </div>

        <h1 className="mb-6 text-4xl font-black tracking-tight text-[#5D3FD3] md:text-6xl">
          Reservasi Meja Mahjong dengan Mudah
        </h1>

        <p className="mb-8 max-w-2xl text-lg text-slate-600">
          Booking store, pilih meja, pilih slot jam, lalu konfirmasi pembayaran
          untuk bermain di Threefrogs.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="/stores"
            className="rounded-2xl bg-[#5D3FD3] px-6 py-3 font-bold text-white"
          >
            Lihat Store
          </a>

          <a
            href="/reserve"
            className="rounded-2xl border border-[#5D3FD3] px-6 py-3 font-bold text-[#5D3FD3]"
          >
            Mulai Reservasi
          </a>
        </div>
      </section>
    </main>
  );
}