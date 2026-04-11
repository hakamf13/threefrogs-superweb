import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import StoreSettingsForm from "./store-settings-form";
import TableSettingsManager from "./table-settings-manager";

export const dynamic = "force-dynamic";

type AdminStoreDetailPageProps = {
	params: Promise<{
		id: string;
	}>;
};

export default async function AdminStoreDetailPage({
	params,
}: AdminStoreDetailPageProps) {
	const session = await auth();

	if (!session?.user || session.user.role !== "ADMIN") {
		redirect("/login?callbackUrl=/admin/stores");
	}

	const { id } = await params;

	const store = await prisma.store.findUnique({
		where: { id },
		include: {
			tables: {
				orderBy: [
					{ tableNumber: "asc" },
				],
			},
		},
	});

	if (!store) {
		notFound();
	}

	return (
		<main className="min-h-screen bg-[var(--tf-bg)] px-4 py-12 text-slate-800 sm:px-6 sm:py-16">
			<div className="mx-auto max-w-7xl space-y-8">
				<div className="flex flex-wrap gap-3">
					<Link
						href="/admin/stores"
						className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
					>
						Kembali ke Store Management
					</Link>
				</div>

				<div>
					<p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
						Store Management
					</p>
					<h1 className="mt-3 text-4xl font-black text-[var(--tf-purple)]">
						{store.name}
					</h1>
					<p className="mt-2 max-w-3xl text-slate-600">
						Kelola informasi store, jam operasional, lokasi, dan semua data meja
						dari satu halaman.
					</p>
				</div>

				<div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
					<StoreSettingsForm
						store={{
							id: store.id,
							name: store.name,
							slug: store.slug,
							city: store.city,
							address: store.address,
							locationHint: store.locationHint ?? null,
							description: store.description,
							openingHour: store.openingHour ?? 11,
							closingHour: store.closingHour ?? 22,
							isActive: store.isActive,
							coverImageUrl: store.coverImageUrl,
						}}
					/>

					<TableSettingsManager
						storeId={store.id}
						tables={store.tables.map((table) => ({
							id: table.id,
							tableNumber: table.tableNumber,
							tableCode: table.tableCode,
							displayLabel: table.displayLabel ?? null,
							capacity: table.capacity,
							notes: table.note ?? null,
							isActive: table.isActive,
						}))}
					/>
				</div>
			</div>
		</main>
	);
}