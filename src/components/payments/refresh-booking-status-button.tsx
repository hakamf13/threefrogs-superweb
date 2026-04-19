"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type RefreshBookingStatusButtonProps = {
	label?: string;
};

export default function RefreshBookingStatusButton({
	label = "Refresh Status",
}: RefreshBookingStatusButtonProps) {
	const router = useRouter();
	const [isRefreshing, setIsRefreshing] = useState(false);

	const handleRefresh = async () => {
		try {
			setIsRefreshing(true);
			router.refresh();
		} finally {
			setTimeout(() => {
				setIsRefreshing(false);
			}, 600);
		}
	};

	return (
		<button
			type="button"
			onClick={handleRefresh}
			disabled={isRefreshing}
			className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
		>
			{isRefreshing ? "Refreshing..." : label}
		</button>
	);
}