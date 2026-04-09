"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminNavLinkProps = {
	href: string;
	label: string;
};

export default function AdminNavLink({
	href,
	label,
}: AdminNavLinkProps) {
	const pathname = usePathname();

	const isActive =
		href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

	return (
		<Link
			href={href}
			className={[
				"rounded-2xl px-4 py-2 text-sm font-semibold transition",
				isActive
					? "bg-[var(--tf-lavender)] text-[var(--tf-purple)]"
					: "border border-slate-300 text-slate-700 hover:bg-slate-50",
			].join(" ")}
		>
			{label}
		</Link>
	);
}