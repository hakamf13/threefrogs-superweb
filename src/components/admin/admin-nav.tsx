"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
	href: string;
	label: string;
};

const operationalLinks: NavItem[] = [
	{ href: "/admin", label: "Dashboard" },
	{ href: "/admin/today-operations", label: "Operasional Hari Ini" },
	{ href: "/admin/bookings", label: "Semua Booking" },
	{ href: "/admin/manual-booking", label: "Booking Manual" },
	{ href: "/admin/availability", label: "Ketersediaan Meja" },
	{ href: "/admin/walk-in", label: "Kelola Walk-in" },
];

const paymentLinks: NavItem[] = [
	{ href: "/admin/payment-ops", label: "Pemantauan Pembayaran" },
	{ href: "/admin/payment-readiness", label: "Kesiapan Pembayaran" },
];

const settingsLinks: NavItem[] = [
	{ href: "/admin/stores", label: "Kelola Store" },
	{ href: "/admin/health-check", label: "Pemeriksaan Sistem" },
];

function isActivePath(pathname: string, href: string) {
	if (href === "/admin") {
		return pathname === "/admin";
	}

	return pathname === href || pathname.startsWith(`${href}/`);
}

function getLinkClass(isActive: boolean) {
	return isActive
		? "rounded-2xl border border-[var(--tf-purple)] bg-[var(--tf-lavender)] px-4 py-2 text-sm font-semibold text-[var(--tf-purple)]"
		: "rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50";
}

function NavSection({
	title,
	items,
	pathname,
}: {
	title: string;
	items: NavItem[];
	pathname: string;
}) {
	return (
		<div className="space-y-3">
			<p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
				{title}
			</p>

			<div className="flex flex-wrap gap-3">
				{items.map((item) => {
					const active = isActivePath(pathname, item.href);

					return (
						<Link
							key={item.href}
							href={item.href}
							className={getLinkClass(active)}
						>
							{item.label}
						</Link>
					);
				})}
			</div>
		</div>
	);
}

export default function AdminNav() {
	const pathname = usePathname();

	return (
		<div className="space-y-5">
			<NavSection
				title="Operasional"
				items={operationalLinks}
				pathname={pathname}
			/>

			<NavSection
				title="Pembayaran"
				items={paymentLinks}
				pathname={pathname}
			/>

			<NavSection
				title="Pengaturan"
				items={settingsLinks}
				pathname={pathname}
			/>
		</div>
	);
}