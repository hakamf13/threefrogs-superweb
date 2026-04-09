"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type HeaderNavLinkProps = {
	href: string;
	label: string;
};

export default function HeaderNavLink({
	href,
	label,
}: HeaderNavLinkProps) {
	const pathname = usePathname();
	const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

	return (
		<Link
			href={href}
			className={[
				"inline-flex items-center rounded-full px-3.5 py-2 text-sm font-semibold transition",
				isActive
					? "bg-[var(--tf-lavender)] text-[var(--tf-purple)]"
					: "text-slate-700 hover:bg-[var(--tf-lavender)] hover:text-[var(--tf-purple)]",
			].join(" ")}
		>
			{label}
		</Link>
	);
}