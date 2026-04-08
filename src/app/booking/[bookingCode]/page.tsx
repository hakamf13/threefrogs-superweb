import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { expireOverdueBookings } from "@/features/reservations/expire-overdue-bookings";
import PaymentProofUploader from "@/components/payments/payment-proof-uploader";
import {
  formatDateDisplay,
  formatDateTimeDisplay,
  formatHourLabel,
  formatRupiah,
  getBookingStatusDescription,
  getBookingStatusLabel,
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

  return (
	<>
	  <SiteHeader />

	  <main className="min-h-screen bg-slate-50">
		<section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
		  <div className="mb-6">
			<p className="text-sm font-medium text-slate-500">Kode Booking</p>
			<h1 className="mt-1 text-3xl font-bold text-slate-900">
			  {booking.bookingCode}
			</h1>
		  </div>

		  <div
			className={`mb-6 rounded-3xl border p-5 ${getBookingStatusPanelClass(
			  booking.status
			)}`}
		  >
			<div className="flex flex-wrap items-center gap-3">
			  <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-semibold">
				{getBookingStatusLabel(booking.status)}
			  </span>
			  <span className="text-sm">
				{getBookingStatusDescription(booking.status)}
			  </span>
			</div>

			{booking.status === "AWAITING_PAYMENT" && booking.expiresAt ? (
			  <p className="mt-3 text-sm">
				Batas pembayaran: {formatDateTimeDisplay(booking.expiresAt)}
			  </p>
			) : null}

			{latestRejectedProof?.rejectionReason ? (
			  <div className="mt-4 rounded-2xl bg-white/80 p-4">
				<p className="text-sm font-semibold text-slate-900">
				  Catatan Admin
				</p>
				<p className="mt-1 text-sm text-slate-700">
				  {latestRejectedProof.rejectionReason}
				</p>
			  </div>
			) : null}
		  </div>

		  <div className="grid gap-6 lg:grid-cols-3">
			<div className="rounded-3xl border bg-white p-6 lg:col-span-2">
			  <h2 className="text-xl font-semibold text-slate-900">
				Detail Booking
			  </h2>

			  <div className="mt-5 grid gap-4 sm:grid-cols-2">
				<div>
				  <p className="text-sm text-slate-500">Nama Pemesan</p>
				  <p className="font-medium text-slate-900">
					{booking.customerName}
				  </p>
				</div>

				<div>
				  <p className="text-sm text-slate-500">Nomor HP</p>
				  <p className="font-medium text-slate-900">
					{booking.customerPhone}
				  </p>
				</div>

				<div>
				  <p className="text-sm text-slate-500">Store</p>
				  <p className="font-medium text-slate-900">
					{booking.store.name}
				  </p>
				</div>

				<div>
				  <p className="text-sm text-slate-500">Meja</p>
				  <p className="font-medium text-slate-900">
					{booking.table.displayLabel || `Meja ${booking.table.tableNumber}`}
				  </p>
				</div>

				<div>
				  <p className="text-sm text-slate-500">Tanggal Main</p>
				  <p className="font-medium text-slate-900">
					{formatDateDisplay(booking.bookingDate)}
				  </p>
				</div>

				<div>
				  <p className="text-sm text-slate-500">Durasi</p>
				  <p className="font-medium text-slate-900">
					{booking.totalSlots} jam
				  </p>
				</div>
			  </div>

			  <div className="mt-5">
				<p className="text-sm text-slate-500">Slot Booking</p>
				<div className="mt-2 flex flex-wrap gap-2">
				  {booking.slots.map((slot) => (
					<span
					  key={slot.id}
					  className="rounded-full border bg-slate-50 px-3 py-1 text-sm"
					>
					  {formatHourLabel(slot.slotHour)}
					</span>
				  ))}
				</div>
			  </div>

			  {booking.notes ? (
				<div className="mt-5">
				  <p className="text-sm text-slate-500">Catatan Booking</p>
				  <p className="mt-1 text-slate-800">{booking.notes}</p>
				</div>
			  ) : null}
			</div>

			<div className="rounded-3xl border bg-white p-6">
			  <h2 className="text-xl font-semibold text-slate-900">
				Total Pembayaran
			  </h2>
			  <p className="mt-2 text-3xl font-bold text-slate-900">
				{formatRupiah(booking.totalPrice)}
			  </p>

			  {showMidtransPendingCard ? (
				<div className="mt-6 rounded-2xl border border-slate-200 p-4">
				  <p className="text-sm font-semibold text-slate-900">
					Midtrans Payment
				  </p>
				  <h3 className="mt-1 text-lg font-bold text-slate-900">
					Pembayaran Otomatis
				  </h3>
				  <p className="mt-2 text-sm text-slate-600">
					Booking ini sudah terhubung ke Midtrans Snap. Klik tombol di
					bawah untuk menyelesaikan pembayaran.
				  </p>
				  <p className="mt-3 text-sm font-medium text-slate-700">
					Midtrans{" "}
					{getPaymentGatewayStatusLabel(booking.paymentGatewayStatus)}
				  </p>
				  <a
					href={booking.paymentCheckoutUrl!}
					target="_blank"
					rel="noreferrer"
					className="mt-4 inline-flex rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
				  >
					Bayar Sekarang
				  </a>
				</div>
			  ) : null}

			  {showMidtransSuccessCard ? (
				<div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
				  <p className="text-sm font-semibold text-emerald-800">
					Midtrans Payment
				  </p>
				  <h3 className="mt-1 text-lg font-bold text-emerald-900">
					Pembayaran Berhasil
				  </h3>
				  <p className="mt-2 text-sm text-emerald-800">
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
				<div className="mt-6 rounded-2xl border border-slate-200 p-4">
				  <p className="text-sm font-semibold text-slate-900">
					Transfer Manual
				  </p>
				  <div className="mt-3 space-y-1 text-sm text-slate-700">
					<p>Bank: BCA</p>
					<p>No. Rekening: 1234567890</p>
					<p>Atas Nama: Threefrogs</p>
				  </div>
				</div>
			  ) : null}

			  {showManualProofFallback ? (
				<div className="mt-6">
				  <PaymentProofUploader
					bookingCode={booking.bookingCode}
					bookingStatus={booking.status}
					existingProofCount={booking.paymentProofs.length}
				  />
				</div>
			  ) : null}
			</div>
		  </div>

		  {booking.paymentProofs.length > 0 ? (
			<div className="mt-6 rounded-3xl border bg-white p-6">
			  <h2 className="text-xl font-semibold text-slate-900">
				Riwayat Bukti Pembayaran
			  </h2>

			  <div className="mt-4 space-y-4">
				{booking.paymentProofs.map((proof, index) => (
				  <div
					key={proof.id}
					className="rounded-2xl border border-slate-200 p-4"
				  >
					<div className="flex flex-wrap items-center justify-between gap-3">
					  <div>
						<p className="font-medium text-slate-900">
						  {index === 0
							? "Bukti Terbaru"
							: proof.fileName || "Bukti Pembayaran"}
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
						{getPaymentProofStatusLabel(proof.verificationStatus)}
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
					  className="mt-4 inline-flex rounded-2xl border px-4 py-2 text-sm font-medium text-slate-900"
					>
					  Lihat
					</a>
				  </div>
				))}
			  </div>
			</div>
		  ) : null}

		  <div className="mt-8 flex flex-wrap gap-3">
			<Link
			  href="/my-bookings"
			  className="rounded-2xl border bg-white px-4 py-3 text-sm font-semibold text-slate-900"
			>
			  Lihat Booking Saya
			</Link>
			<Link
			  href="/reserve"
			  className="rounded-2xl border bg-white px-4 py-3 text-sm font-semibold text-slate-900"
			>
			  Buat Booking Lagi
			</Link>
			<Link
			  href="/"
			  className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
			>
			  Kembali ke Beranda
			</Link>
		  </div>
		</section>
	  </main>

	  <SiteFooter />
	</>
  );
}

/*
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import { prisma } from "@/lib/prisma";
import { expireOverdueBookings } from "@/features/reservations/expire-overdue-bookings";
import PaymentProofUploader from "@/components/payments/payment-proof-uploader";
import {
	formatDateDisplay,
	formatDateTimeDisplay,
	formatHourLabel,
	formatRupiah,
	getBookingStatusDescription,
	getBookingStatusLabel,
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

export default async function BookingDetailPage({
	params,
}: BookingDetailPageProps) {
	await expireOverdueBookings();

	const { bookingCode } = await params;

	const booking = await prisma.booking.findUnique({
		where: {
			bookingCode,
		},
		include: {
			store: true,
			table: true,
			slots: {
				orderBy: {
					slotHour: "asc",
				},
			},
			paymentProofs: {
				orderBy: {
					uploadedAt: "desc",
				},
			},
		},
	});

	if (!booking) {
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
		isMidtransBooking &&
		booking.status === "CONFIRMED";

	const showManualProofFallback =
		!booking.paymentGatewayProvider &&
		(booking.status === "AWAITING_PAYMENT" ||
			booking.status === "PENDING_VERIFICATION");

	return (
		<div className="min-h-screen bg-[var(--tf-bg)] text-slate-800">
			<SiteHeader />

			<main className="px-6 py-16">
				<div className="mx-auto max-w-3xl space-y-6">
					<section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[var(--tf-shadow-card)]">
						<div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
							<div>
								<p className="text-sm font-semibold uppercase tracking-widest text-[var(--tf-orange-dark)]">
									Kode Booking
								</p>
								<h1 className="mt-2 text-3xl font-black text-[var(--tf-purple)] md:text-4xl">
									{booking.bookingCode}
								</h1>
							</div>

							<span
								className={`rounded-full border px-4 py-2 text-sm font-bold ${getBookingStatusPanelClass(
									booking.status
								)}`}
							>
								{getBookingStatusLabel(booking.status)}
							</span>
						</div>

						<div
							className={`rounded-[1.5rem] border p-5 ${getBookingStatusPanelClass(
								booking.status
							)}`}
						>
							<p className="font-bold">{getBookingStatusLabel(booking.status)}</p>
							<p className="mt-2 text-sm leading-6">
								{getBookingStatusDescription(booking.status)}
							</p>

							{booking.status === "AWAITING_PAYMENT" && booking.expiresAt ? (
								<p className="mt-3 text-sm font-semibold">
									Batas pembayaran: {formatDateTimeDisplay(booking.expiresAt)}
								</p>
							) : null}
						</div>

						{latestRejectedProof?.rejectionReason ? (
							<div className="mt-5 rounded-[1.5rem] border border-red-200 bg-red-50 p-5 text-red-700">
								<p className="font-bold">Catatan Admin</p>
								<p className="mt-2 text-sm leading-6">
									{latestRejectedProof.rejectionReason}
								</p>
							</div>
						) : null}

						<div className="mt-8 grid gap-4 md:grid-cols-2">
							<div>
								<p className="text-sm text-slate-500">Nama Pemesan</p>
								<p className="font-semibold">{booking.customerName}</p>
							</div>

							<div>
								<p className="text-sm text-slate-500">Nomor HP</p>
								<p className="font-semibold">{booking.customerPhone}</p>
							</div>

							<div>
								<p className="text-sm text-slate-500">Store</p>
								<p className="font-semibold">{booking.store.name}</p>
							</div>

							<div>
								<p className="text-sm text-slate-500">Meja</p>
								<p className="font-semibold">Meja {booking.table.tableNumber}</p>
							</div>

							<div>
								<p className="text-sm text-slate-500">Tanggal Main</p>
								<p className="font-semibold">
									{formatDateDisplay(booking.bookingDate)}
								</p>
							</div>

							<div>
								<p className="text-sm text-slate-500">Durasi</p>
								<p className="font-semibold">{booking.totalSlots} jam</p>
							</div>
						</div>

						<div className="mt-8">
							<p className="mb-3 text-sm text-slate-500">Slot Booking</p>
							<div className="grid gap-3 sm:grid-cols-2">
								{booking.slots.map((slot) => (
									<div
										key={slot.id}
										className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
									>
										<p className="font-semibold text-[var(--tf-purple)]">
											{formatHourLabel(slot.slotHour)}
										</p>
									</div>
								))}
							</div>
						</div>

						{booking.notes ? (
							<div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
								<p className="text-sm font-semibold text-slate-500">
									Catatan Booking
								</p>
								<p className="mt-2 text-sm leading-6 text-slate-700">
									{booking.notes}
								</p>
							</div>
						) : null}

						<div className="mt-8 border-t border-slate-200 pt-6">
							<p className="text-sm text-slate-500">Total Pembayaran</p>
							<p className="text-3xl font-black text-[var(--tf-purple)]">
								{formatRupiah(booking.totalPrice)}
							</p>
						</div>

						{showMidtransPendingCard ? (
							<div className="mt-8 rounded-[1.5rem] border border-[var(--tf-purple)] bg-[var(--tf-lavender)] p-5">
								<p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
									Midtrans Payment
								</p>
								<h2 className="mt-2 text-2xl font-black text-[var(--tf-purple)]">
									Pembayaran Otomatis
								</h2>
								<p className="mt-3 text-sm leading-6 text-slate-700">
									Booking ini sudah terhubung ke Midtrans Snap. Klik tombol di
									bawah untuk menyelesaikan pembayaran.
								</p>

								<div className="mt-4 flex flex-wrap gap-2">
									<span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--tf-purple-dark)]">
										Midtrans
									</span>
									<span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--tf-orange-dark)]">
										{getPaymentGatewayStatusLabel(booking.paymentGatewayStatus)}
									</span>
								</div>

								<a
									href={booking.paymentCheckoutUrl!}
									target="_blank"
									rel="noreferrer"
									className="mt-5 inline-flex rounded-2xl bg-[var(--tf-purple)] px-5 py-3 font-bold text-white transition hover:bg-[var(--tf-purple-dark)]"
								>
									Bayar Sekarang
								</a>
							</div>
						) : null}

						{showMidtransSuccessCard ? (
							<div className="mt-8 rounded-[1.5rem] border border-green-200 bg-green-50 p-5 text-green-800">
								<p className="text-sm font-black uppercase tracking-widest">
									Midtrans Payment
								</p>
								<h2 className="mt-2 text-2xl font-black">
									Pembayaran Berhasil
								</h2>
								<p className="mt-3 text-sm leading-6">
									Booking ini telah dibayar melalui Midtrans dan sudah
									terkonfirmasi otomatis oleh sistem.
								</p>

								<div className="mt-4 flex flex-wrap gap-2">
									<span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-green-700">
										Midtrans
									</span>
									<span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-green-700">
										{getPaymentGatewayStatusLabel(booking.paymentGatewayStatus)}
									</span>
								</div>
							</div>
						) : null}

						{!isMidtransBooking ? (
							<div className="mt-8 rounded-[1.5rem] bg-[var(--tf-cream)] p-5 text-sm text-slate-700">
								<p className="font-bold text-[var(--tf-purple-dark)]">
									Transfer Manual
								</p>
								<p className="mt-2">Bank: BCA</p>
								<p>No. Rekening: 1234567890</p>
								<p>Atas Nama: Threefrogs</p>
							</div>
						) : null}

						{showManualProofFallback ? (
							<div className="mt-8">
								<PaymentProofUploader
									bookingCode={booking.bookingCode}
									bookingStatus={booking.status}
									existingProofCount={booking.paymentProofs.length}
								/>
							</div>
						) : null}

						{booking.paymentProofs.length > 0 ? (
							<div className="mt-8">
								<p className="mb-3 text-sm text-slate-500">
									Riwayat Bukti Pembayaran
								</p>

								<div className="space-y-3">
									{booking.paymentProofs.map((proof, index) => (
										<div
											key={proof.id}
											className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4"
										>
											<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
												<div>
													<p className="font-semibold text-slate-800">
														{index === 0
															? "Bukti Terbaru"
															: proof.fileName || "Bukti Pembayaran"}
													</p>
													<p className="text-sm text-slate-500">
														{formatDateTimeDisplay(proof.uploadedAt)}
													</p>
													{proof.rejectionReason ? (
														<p className="mt-1 text-sm text-slate-600">
															Catatan: {proof.rejectionReason}
														</p>
													) : null}
												</div>

												<div className="flex items-center gap-3">
													<span
														className={`rounded-full px-3 py-1 text-xs font-bold ${getPaymentProofStatusColor(
															proof.verificationStatus
														)}`}
													>
														{getPaymentProofStatusLabel(
															proof.verificationStatus
														)}
													</span>

													<a
														href={proof.fileUrl}
														target="_blank"
														rel="noreferrer"
														className="rounded-2xl border border-[var(--tf-purple)] px-4 py-2 font-semibold text-[var(--tf-purple)]"
													>
														Lihat
													</a>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						) : null}

						<div className="mt-8 flex flex-wrap gap-3">
							<Link
								href="/my-bookings"
								className="rounded-2xl bg-[var(--tf-purple)] px-5 py-3 font-bold text-white transition hover:bg-[var(--tf-purple-dark)]"
							>
								Lihat Booking Saya
							</Link>

							<Link
								href="/reserve"
								className="rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-700"
							>
								Buat Booking Lagi
							</Link>

							<Link
								href="/"
								className="rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-700"
							>
								Kembali ke Beranda
							</Link>
						</div>
					</section>
				</div>
			</main>

			<SiteFooter />
		</div>
	);
}*/