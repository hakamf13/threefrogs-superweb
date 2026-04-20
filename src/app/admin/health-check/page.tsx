import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function hasValue(value?: string | null) {
	return Boolean(value && value.trim().length > 0);
}

function getBadgeClass(ok: boolean) {
	return ok
		? "border border-green-200 bg-green-50 text-green-700"
		: "border border-red-200 bg-red-50 text-red-700";
}

function getBadgeText(ok: boolean) {
	return ok ? "Aman" : "Perlu dicek";
}

function getTodayRange() {
	const now = new Date();
	const start = new Date(now);
	start.setHours(0, 0, 0, 0);

	const end = new Date(now);
	end.setHours(23, 59, 59, 999);

	return { start, end };
}

const cardClass =
	"rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-[var(--tf-shadow-card)]";

export default async function AdminHealthCheckPage() {
	const { start, end } = getTodayRange();

	const [
		activeStores,
		activeTables,
		todayBookings,
		activeWalkIns,
		awaitingPaymentCount,
		pendingVerificationCount,
	] = await Promise.all([
		prisma.store.count({
			where: {
				isActive: true,
				category: "MAHJONG",
			},
		}),
		prisma.table.count({
			where: {
				isActive: true,
				store: {
					isActive: true,
					category: "MAHJONG",
				},
			},
		}),
		prisma.booking.count({
			where: {
				bookingDate: {
					gte: start,
					lte: end,
				},
			},
		}),
		prisma.walkInSession.count({
			where: {
				status: "ACTIVE",
			},
		}),
		prisma.booking.count({
			where: {
				status: "AWAITING_PAYMENT",
			},
		}),
		prisma.booking.count({
			where: {
				status: "PENDING_VERIFICATION",
			},
		}),
	]);

	const paymentMode = process.env.PAYMENT_MODE ?? "MANUAL";
	const isMidtransMode = paymentMode === "MIDTRANS";
	const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

	const checks = [
		{
			label: "Alamat aplikasi tersedia",
			ok: hasValue(process.env.APP_BASE_URL),
			note: process.env.APP_BASE_URL || "Belum diatur",
		},
		{
			label: "Alamat autentikasi tersedia",
			ok: hasValue(process.env.AUTH_URL),
			note: process.env.AUTH_URL || "Belum diatur",
		},
		{
			label: "Cloudinary siap dipakai",
			ok:
				hasValue(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) &&
				hasValue(process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET),
			note:
				hasValue(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) &&
				hasValue(process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET)
					? "Konfigurasi upload tersedia"
					: "Periksa pengaturan Cloudinary",
		},
		{
			label: "Midtrans siap dipakai",
			ok:
				isMidtransMode &&
				hasValue(process.env.MIDTRANS_SERVER_KEY) &&
				hasValue(process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY) &&
				hasValue(process.env.MIDTRANS_MERCHANT_ID),
			note: isMidtransMode
				? isProduction
					? "Mode produksi aktif"
					: "Mode percobaan aktif"
				: "Masih memakai alur manual",
		},
		{
			label: "Email notifikasi siap dipakai",
			ok:
				hasValue(process.env.RESEND_API_KEY) &&
				hasValue(process.env.EMAIL_FROM),
			note:
				hasValue(process.env.RESEND_API_KEY) &&
				hasValue(process.env.EMAIL_FROM)
					? "Pengiriman email tersedia"
					: "Email belum diaktifkan",
		},
	];

	const overallHealthy = checks.every((item) => item.ok);

	return (
		<main className="min-h-screen bg-[var(--tf-bg)] px-4 py-12 text-slate-800 sm:px-6 sm:py-16">
			<div className="mx-auto max-w-7xl space-y-8">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div>
						<p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
							Pemeriksaan Sistem
						</p>
						<h1 className="mt-3 text-4xl font-black text-[var(--tf-purple)]">
							Cek Kondisi Operasional
						</h1>
						<p className="mt-2 max-w-3xl text-slate-600">
							Gunakan halaman ini untuk memastikan layanan utama siap digunakan
							dan melihat ringkasan kondisi operasional hari ini.
						</p>
					</div>

					<div className="flex flex-wrap gap-3">
						<Link
							href="/admin"
							className="rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-700"
						>
							Kembali ke Dashboard
						</Link>
						<Link
							href="/admin/today-operations"
							className="rounded-2xl bg-[var(--tf-purple)] px-5 py-3 font-bold text-white transition hover:bg-[var(--tf-purple-dark)]"
						>
							Buka Operasional Hari Ini
						</Link>
					</div>
				</div>

				<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
					<div className={cardClass}>
						<p className="text-sm text-slate-500">Store aktif</p>
						<p className="mt-2 text-3xl font-black text-[var(--tf-purple)]">
							{activeStores}
						</p>
					</div>

					<div className={cardClass}>
						<p className="text-sm text-slate-500">Meja aktif</p>
						<p className="mt-2 text-3xl font-black text-[var(--tf-purple)]">
							{activeTables}
						</p>
					</div>

					<div className={cardClass}>
						<p className="text-sm text-slate-500">Booking hari ini</p>
						<p className="mt-2 text-3xl font-black text-slate-700">
							{todayBookings}
						</p>
					</div>

					<div className={cardClass}>
						<p className="text-sm text-slate-500">Walk-in aktif</p>
						<p className="mt-2 text-3xl font-black text-[var(--tf-purple)]">
							{activeWalkIns}
						</p>
					</div>

					<div className={cardClass}>
						<p className="text-sm text-slate-500">Menunggu pembayaran</p>
						<p className="mt-2 text-3xl font-black text-orange-600">
							{awaitingPaymentCount}
						</p>
					</div>

					<div className={cardClass}>
						<p className="text-sm text-slate-500">Menunggu pengecekan</p>
						<p className="mt-2 text-3xl font-black text-yellow-600">
							{pendingVerificationCount}
						</p>
					</div>
				</section>

				<section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
					<div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
						<div className="flex items-start justify-between gap-4">
							<div>
								<p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
									Status Sistem
								</p>
								<h2 className="mt-2 text-2xl font-black text-[var(--tf-purple)]">
									Pemeriksaan Utama
								</h2>
							</div>

							<span
								className={`rounded-full px-3 py-1 text-xs font-bold ${getBadgeClass(
									overallHealthy
								)}`}
							>
								{overallHealthy ? "Siap digunakan" : "Perlu perhatian"}
							</span>
						</div>

						<div className="mt-6 space-y-3">
							{checks.map((item) => (
								<div
									key={item.label}
									className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-4"
								>
									<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
										<div>
											<p className="font-semibold text-slate-900">{item.label}</p>
											<p className="mt-1 text-sm text-slate-600">{item.note}</p>
										</div>

										<span
											className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${getBadgeClass(
												item.ok
											)}`}
										>
											{getBadgeText(item.ok)}
										</span>
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="space-y-6">
						<section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
							<p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
								Tindakan Cepat
							</p>
							<h2 className="mt-2 text-2xl font-black text-[var(--tf-purple)]">
								Buka Halaman Penting
							</h2>

							<div className="mt-5 grid gap-3">
								<Link
									href="/admin/payment-ops"
									className="rounded-2xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
								>
									Lihat pemantauan pembayaran
								</Link>
								<Link
									href="/admin/walk-in"
									className="rounded-2xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
								>
									Kelola sesi walk-in
								</Link>
								<Link
									href="/admin/availability"
									className="rounded-2xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
								>
									Lihat ketersediaan meja
								</Link>
								<Link
									href="/admin/stores"
									className="rounded-2xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
								>
									Periksa data store
								</Link>
							</div>
						</section>

						<section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
							<p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
								Catatan
							</p>
							<h2 className="mt-2 text-2xl font-black text-[var(--tf-purple)]">
								Hal yang Perlu Diperhatikan
							</h2>

							<div className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
								<div className="rounded-[1.25rem] bg-slate-50 p-4">
									Jika pembayaran otomatis aktif, pastikan status booking ikut
									berubah setelah pembayaran selesai.
								</div>
								<div className="rounded-[1.25rem] bg-slate-50 p-4">
									Jika jumlah walk-in aktif tinggi, cek kembali sesi yang hampir
									selesai agar tidak terlewat.
								</div>
								<div className="rounded-[1.25rem] bg-slate-50 p-4">
									Jika ada booking yang menunggu pengecekan, prioritaskan
									penanganannya agar meja tidak tertahan terlalu lama.
								</div>
							</div>
						</section>
					</div>
				</section>
			</div>
		</main>
	);
}