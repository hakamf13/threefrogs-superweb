"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type HeaderHomeLinkProps = {
	className: string;
};

export default function HeaderHomeLink({
	className,
}: HeaderHomeLinkProps) {
	const pathname = usePathname();

	if (pathname === "/") {
		return (
			<button
				type="button"
				onClick={() => {
					window.scrollTo({
						top: 0,
						behavior: "smooth",
					});
				}}
				className={className}
			>
				Beranda
			</button>
		);
	}

	return (
		<Link href="/#page-top" className={className}>
			Beranda
		</Link>
	);
}