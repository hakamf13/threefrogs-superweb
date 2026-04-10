import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
	CalendarDays,
	CheckCircle2,
	CreditCard,
	Receipt,
	UploadCloud,
} from "lucide-react";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { expireOverdueBookings } from "@/features/reservations/expire-overdue-bookings";
import PaymentProofUploader from "@/components/payments/payment-proof-uploader";
import CancelBookingButton from "@/components/reservations/cancel-booking-button";
import BookingStatusChip from "@/components/bookings/booking-status-chip";
import {
	formatDateDisplay,
	formatDateTimeDisplay,
	formatHourLabel,
	formatRupiah,
	getBookingStatusDescription,
	getBookingStatusPanelClass,
	getPaymentGatewayStatusLabel,
	getPaymentProofStatusColor,
	getPaymentProofStatusLabel,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

type BookingDetailPageProps = {
	params: Promise<{
		bookingCode: string;
	}>;
};

const panelClass =
	"rounded-[2rem] border border-[var(--tf-border)] bg-[var(--tf-surface)] p-6 shadow-[var(--tf-shadow-card)]";

export default async function BookingDetailPage({
	params,
}: BookingDetailPageProps) {
	const session = await auth();

	if (!session?.user?.id) {
		redirect("/login?callbackUrl=/my-bookings");
	}

	await expireOverdueBookings();

	const { bookingCode } = await params;

	const booking = await prisma.booking.findUnique({
		where: { bookingCode },
		include: {
			store: true,
			table: true,
			slots: {
				orderBy: { slotHour: "asc" },
			},
			paymentProofs: {
				orderBy: { uploadedAt: "desc" },
			},
		},
	});

	if (!booking) {
		notFound();
	}

	const isAdmin = session.user.role === "ADMIN";
	const isOwner = booking.userId === session.user.id;

	if (!isAdmin && !isOwner) {
		notFound();
	}

	const latestRejectedProof = booking.paymentProofs.find(
		(proof) => proof.verificationStatus === "REJECTED"
	);

	const isMidtransBooking = booking.paymentGatewayProvider === "MIDTRANS";
	const showMidtransPendingCard =
		isMidtransBooking &&
		booking.status === "AWAITING_PAYMENT" &&
		!!booking.paymentCheckoutUrl;

	const showMidtransSuccessCard =
		isMidtransBooking && booking.status === "CONFIRMED";

	const showManualProofFallback =
		!booking.paymentGatewayProvider &&
		(booking.status === "AWAITING_PAYMENT" ||
			booking.status === "PENDING_VERIFICATION");

	const canCancel =
		booking.status === "AWAITING_PAYMENT" ||
		booking.status === "PENDING_VERIFICATION" ||
		booking.status === "CONFIRMED";

	return (
		<div className="min-h-screen bg-[var(--tf-bg)] text-slate-800">
			<SiteHeader />

			<main className="px-4 py-10 sm:px-6 lg:px-8">
				<section className="mx-auto max-w-6xl space-y-8">
					<div className="space-y-3">
						<p className="inline-flex rounded-full bg-[var(--tf-cream)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
							Booking Detail
						</p>
						<div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
							<div>
								<p className="text-sm text-slate-500">Kode Booking</p>
								<h1 className="mt-1 text-3xl font-black tracking-tight text-[var(--tf-purple)] md:text-5xl">
									{booking.bookingCode}
								</h1>
							</div>

							<BookingStatusChip status={booking.status} />
						</div>
					</div>

					<div
						className={`rounded-[2rem] border p-5 ${getBookingStatusPanelClass(
							booking.status
						)}`}
					>
						<p className="font-bold text-slate-900">Status booking</p>
						<p className="mt-2 text-sm leading-6 text-slate-700">
							{getBookingStatusDescription(booking.status)}
						</p>

						{booking.status === "AWAITING_PAYMENT" && booking.expiresAt ? (
							<p className="mt-3 text-sm font-semibold text-slate-800">
								Batas pembayaran: {formatDateTimeDisplay(booking.expiresAt)}
							</p>
						) : null}

						{latestRejectedProof?.rejectionReason ? (
							<div className="mt-4 rounded-2xl bg-white/80 p-4">
								<p className="text-sm font-semibold text-slate-900">
									Catatan admin
								</p>
								<p className="mt-1 text-sm text-slate-700">
									{latestRejectedProof.rejectionReason}
								</p>
							</div>
						) : null}
					</div>

					<div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
						<div className="min-w-0 space-y-6">
							<div className={panelClass}>
								<div className="mb-5 flex items-center gap-3">
									<div className="rounded-2xl bg-[var(--tf-lavender)] p-3 text-[var(--tf-purple)]">
										<Receipt className="h-5 w-5" />
									</div>
									<div>
										<p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
											Detail
										</p>
										<h2 className="text-2xl font-black text-[var(--tf-purple)]">
											Detail Booking
										</h2>
									</div>
								</div>

								<div className="grid gap-4 sm:grid-cols-2">
									<div className="rounded-2xl bg-[var(--tf-surface-muted)] p-4">
										<p className="text-sm text-slate-500">Nama pemesan</p>
										<p className="mt-1 font-semibold text-slate-900">
											{booking.customerName}
										</p>
									</div>

									<div className="rounded-2xl bg-[var(--tf-surface-muted)] p-4">
										<p className="text-sm text-slate-500">Nomor HP</p>
										<p className="mt-1 font-semibold text-slate-900">
											{booking.customerPhone}
										</p>
									</div>

									<div className="rounded-2xl bg-[var(--tf-surface-muted)] p-4">
										<p className="text-sm text-slate-500">Store</p>
										<p className="mt-1 font-semibold text-slate-900">
											{booking.store.name}
										</p>
									</div>

									<div className="rounded-2xl bg-[var(--tf-surface-muted)] p-4">
										<p className="text-sm text-slate-500">Meja</p>
										<p className="mt-1 font-semibold text-slate-900">
											{booking.table.displayLabel ||
												`Meja ${booking.table.tableNumber}`}
										</p>
									</div>

									<div className="rounded-2xl bg-[var(--tf-surface-muted)] p-4">
										<p className="text-sm text-slate-500">Tanggal main</p>
										<p className="mt-1 font-semibold text-slate-900">
											{formatDateDisplay(booking.bookingDate)}
										</p>
									</div>

									<div className="rounded-2xl bg-[var(--tf-surface-muted)] p-4">
										<p className="text-sm text-slate-500">Durasi</p>
										<p className="mt-1 font-semibold text-slate-900">
											{booking.totalSlots} jam
										</p>
									</div>
								</div>

								<div className="mt-5 rounded-2xl bg-[var(--tf-surface-muted)] p-4">
									<div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--tf-purple)]">
										<CalendarDays className="h-4 w-4" />
										Slot booking
									</div>

									<div className="mt-3 flex flex-wrap gap-2">
										{booking.slots.map((slot) => (
											<span
												key={slot.id}
												className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[var(--tf-purple-dark)] shadow-sm"
											>
												{formatHourLabel(slot.slotHour)}
											</span>
										))}
									</div>
								</div>

								{booking.notes ? (
									<div className="mt-5 rounded-2xl bg-[var(--tf-surface-muted)] p-4">
										<p className="text-sm text-slate-500">Catatan booking</p>
										<p className="mt-2 leading-7 text-slate-800">
											{booking.notes}
										</p>
									</div>
								) : null}
							</div>

							{booking.paymentProofs.length > 0 ? (
								<div className={panelClass}>
									<div className="mb-5 flex items-center gap-3">
										<div className="rounded-2xl bg-[var(--tf-lavender)] p-3 text-[var(--tf-purple)]">
											<UploadCloud className="h-5 w-5" />
										</div>
										<div>
											<p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
												Payment Proof
											</p>
											<h2 className="text-2xl font-black text-[var(--tf-purple)]">
												Riwayat Bukti Pembayaran
											</h2>
										</div>
									</div>

									<div className="space-y-4">
										{booking.paymentProofs.map((proof, index) => (
											<div
												key={proof.id}
												className="rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface-muted)] p-4"
											>
												<div className="flex flex-wrap items-center justify-between gap-3">
													<div>
														<p className="font-semibold text-slate-900">
															{index === 0
																? "Bukti terbaru"
																: proof.fileName || "Bukti pembayaran"}
														</p>
														<p className="text-sm text-slate-500">
															{formatDateTimeDisplay(proof.uploadedAt)}
														</p>
													</div>

													<span
														className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentProofStatusColor(
															proof.verificationStatus
														)}`}
													>
														{getPaymentProofStatusLabel(
															proof.verificationStatus
														)}
													</span>
												</div>

												{proof.rejectionReason ? (
													<p className="mt-3 text-sm text-rose-700">
														Catatan: {proof.rejectionReason}
													</p>
												) : null}

												<a
													href={proof.fileUrl}
													target="_blank"
													rel="noreferrer"
													className="mt-4 inline-flex rounded-2xl border border-[var(--tf-border)] bg-white px-4 py-2 text-sm font-medium text-slate-900"
												>
													Lihat bukti
												</a>
											</div>
										))}
									</div>
								</div>
							) : null}
						</div>

						<aside className="xl:sticky xl:top-24">
							<div className={`${panelClass} space-y-5`}>
								<div>
									<p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
										Pembayaran
									</p>
									<h2 className="mt-2 text-2xl font-black text-[var(--tf-purple)]">
										Total Pembayaran
									</h2>
									<p className="mt-3 text-4xl font-black tracking-tight text-slate-900">
										{formatRupiah(booking.totalPrice)}
									</p>
								</div>

								{showMidtransPendingCard ? (
									<div className="rounded-2xl border border-slate-200 bg-[var(--tf-surface-muted)] p-4">
										<div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--tf-purple)]">
											<CreditCard className="h-4 w-4" />
											Midtrans
										</div>

										<h3 className="mt-3 text-lg font-black text-slate-900">
											Pembayaran otomatis
										</h3>
										<p className="mt-2 text-sm leading-6 text-slate-600">
											Booking ini sudah terhubung ke Midtrans Snap. Klik tombol
											di bawah untuk menyelesaikan pembayaran.
										</p>
										<p className="mt-3 text-sm font-medium text-slate-700">
											Midtrans{" "}
											{getPaymentGatewayStatusLabel(booking.paymentGatewayStatus)}
										</p>
										<a
											href={booking.paymentCheckoutUrl!}
											target="_blank"
											rel="noreferrer"
											className="mt-4 inline-flex rounded-2xl bg-[var(--tf-purple)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--tf-purple-dark)]"
										>
											Bayar sekarang
										</a>
									</div>
								) : null}

								{showMidtransSuccessCard ? (
									<div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
										<div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
											<CheckCircle2 className="h-4 w-4" />
											Midtrans
										</div>

										<h3 className="mt-3 text-lg font-black text-emerald-900">
											Pembayaran berhasil
										</h3>
										<p className="mt-2 text-sm leading-6 text-emerald-800">
											Booking ini telah dibayar melalui Midtrans dan sudah
											terkonfirmasi otomatis oleh sistem.
										</p>
										<p className="mt-3 text-sm font-medium text-emerald-900">
											Midtrans{" "}
											{getPaymentGatewayStatusLabel(booking.paymentGatewayStatus)}
										</p>
									</div>
								) : null}

								{!isMidtransBooking ? (
									<div className="rounded-2xl border border-slate-200 bg-[var(--tf-surface-muted)] p-4">
										<p className="text-sm font-semibold text-slate-900">
											Transfer manual
										</p>
										<div className="mt-3 space-y-1 text-sm text-slate-700">
											<p>Bank: BCA</p>
											<p>No. Rekening: 1234567890</p>
											<p>Atas Nama: Threefrogs</p>
										</div>
									</div>
								) : null}

								{showManualProofFallback ? (
									<PaymentProofUploader
										bookingCode={booking.bookingCode}
										bookingStatus={booking.status}
										existingProofCount={booking.paymentProofs.length}
									/>
								) : null}

								{canCancel ? (
									<CancelBookingButton bookingCode={booking.bookingCode} />
								) : null}

								<div className="rounded-2xl bg-slate-50 p-4 text-xs leading-6 text-slate-600">
									<p>• Simpan kode booking untuk memudahkan pengecekan.</p>
									<p>• Kalau bukti bayar ditolak, kamu bisa upload ulang.</p>
									<p>• Booking yang belum dibayar akan otomatis kedaluwarsa.</p>
								</div>
							</div>
						</aside>
					</div>

					<div className="flex flex-wrap gap-3">
						{isOwner ? (
							<Link
								href="/my-bookings"
								className="rounded-2xl border border-[var(--tf-border)] bg-white px-4 py-3 text-sm font-semibold text-slate-900"
							>
								Lihat Booking Saya
							</Link>
						) : null}

						{isAdmin ? (
							<Link
								href="/admin"
								className="rounded-2xl border border-[var(--tf-border)] bg-white px-4 py-3 text-sm font-semibold text-slate-900"
							>
								Kembali ke Admin
							</Link>
						) : null}

						<Link
							href={{
								pathname: "/reserve",
								query: { store: booking.storeId },
							}}
							className="rounded-2xl border border-[var(--tf-border)] bg-white px-4 py-3 text-sm font-semibold text-slate-900"
						>
							Buat booking lagi
						</Link>

						<Link
							href="/"
							className="rounded-2xl bg-[var(--tf-purple)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--tf-purple-dark)]"
						>
							Kembali ke Beranda
						</Link>
					</div>
				</section>
			</main>

			<SiteFooter />
		</div>
	);
}