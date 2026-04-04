import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "../../../lib/prisma";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import ProfileForm from "./profile-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
	const session = await auth();

	if (!session?.user?.id) {
		redirect("/login?callbackUrl=/profile");
	}

	const user = await prisma.user.findUnique({
		where: {
			id: session.user.id,
		},
		select: {
			id: true,
			name: true,
			phone: true,
			email: true,
		},
	});

	if (!user) {
		redirect("/login?callbackUrl=/profile");
	}

	return (
		<div className="min-h-screen bg-[var(--tf-bg)] text-slate-800">
			<SiteHeader />

			<main className="px-6 py-16">
				<div className="mx-auto max-w-5xl grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
					<section className="rounded-[2.5rem] bg-gradient-to-br from-[var(--tf-purple)] via-[var(--tf-purple-dark)] to-[var(--tf-purple)] p-8 text-white shadow-[var(--tf-shadow-card)]">
						<div className="inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-widest text-white/90">
							My Profile
						</div>

						<h1 className="mt-6 text-4xl font-black leading-tight">
							Data akunmu jadi identitas booking
						</h1>

						<p className="mt-4 text-sm leading-7 text-white/85">
							Nama, nomor HP, dan email di halaman ini akan dipakai otomatis
							saat kamu membuat reservasi. Jadi kamu tidak perlu isi ulang data
							pemesan setiap kali booking.
						</p>

						<div className="mt-8 grid gap-4">
							<div className="rounded-[1.5rem] bg-white/10 p-5 backdrop-blur">
								<p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange)]">
									01
								</p>
								<p className="mt-2 text-base font-semibold">
									Update profil sekali, booking jadi lebih ringkas
								</p>
							</div>

							<div className="rounded-[1.5rem] bg-white/10 p-5 backdrop-blur">
								<p className="text-sm font-black uppercase tracking-widest text-[var(--tf-green)]">
									02
								</p>
								<p className="mt-2 text-base font-semibold">
									Nomor HP jadi identitas utama customer
								</p>
							</div>

							<div className="rounded-[1.5rem] bg-white/10 p-5 backdrop-blur">
								<p className="text-sm font-black uppercase tracking-widest text-white/80">
									03
								</p>
								<p className="mt-2 text-base font-semibold">
									Email tetap opsional, tapi bagus untuk cadangan kontak
								</p>
							</div>
						</div>
					</section>

					<section className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-[var(--tf-shadow-card)]">
						<div className="mb-8">
							<p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
								Edit Profile
							</p>
							<h2 className="mt-3 text-4xl font-black text-[var(--tf-purple)]">
								Profil Saya
							</h2>
							<p className="mt-3 text-slate-600">
								Pastikan nama dan nomor HP selalu benar agar reservasi tercatat
								dengan rapi.
							</p>
						</div>

						<ProfileForm
							initialProfile={{
								name: user.name ?? "",
								phone: user.phone ?? "",
								email: user.email ?? "",
							}}
						/>
					</section>
				</div>
			</main>

			<SiteFooter />
		</div>
	);
}