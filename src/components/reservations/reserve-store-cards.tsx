"use client";

type StoreItem = {
	id: string;
	name: string;
	address: string | null;
	city: string | null;
	description: string | null;
	locationHint: string | null;
	coverImageUrl: string | null;
	tables: {
		id: string;
	}[];
};

type ReserveStoreCardsProps = {
	stores: StoreItem[];
	selectedStoreId: string;
	onSelect: (storeId: string) => void;
};

export default function ReserveStoreCards({
	stores,
	selectedStoreId,
	onSelect,
}: ReserveStoreCardsProps) {
	return (
		<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			{stores.map((store, index) => {
				const isSelected = selectedStoreId === store.id;

				return (
					<button
						key={store.id}
						type="button"
						onClick={() => onSelect(store.id)}
						className={`overflow-hidden rounded-[2rem] border text-left transition ${
							isSelected
								? "border-[var(--tf-purple)] bg-[var(--tf-lavender)] shadow-[var(--tf-shadow-card)]"
								: "border-slate-200 bg-white shadow-[var(--tf-shadow-card)] hover:border-[var(--tf-purple)]"
						}`}
					>
						{store.coverImageUrl ? (
							<img
								src={store.coverImageUrl}
								alt={store.name}
								className="h-44 w-full object-cover"
							/>
						) : (
							<div
								className={`h-44 w-full ${
									index % 3 === 0
										? "bg-gradient-to-br from-[var(--tf-lavender)] to-[var(--tf-cream)]"
										: index % 3 === 1
										? "bg-gradient-to-br from-[#fff0d8] to-[#f4ebff]"
										: "bg-gradient-to-br from-[#eef9d8] to-[#f4ebff]"
								}`}
							/>
						)}

						<div className="space-y-3 p-5">
							<div className="flex items-start justify-between gap-3">
								<div>
									<h3 className="text-xl font-black text-[var(--tf-purple)]">
										{store.name}
									</h3>
									<p className="mt-1 text-sm text-slate-500">
										{store.city || "Surabaya"}
									</p>
								</div>

								<span
									className={`rounded-full px-3 py-1 text-xs font-bold ${
										isSelected
											? "bg-white text-[var(--tf-purple)]"
											: "bg-[var(--tf-cream)] text-[var(--tf-orange-dark)]"
									}`}
								>
									{isSelected ? "Dipilih" : "Pilih"}
								</span>
							</div>

							{store.address ? (
								<p className="text-sm leading-6 text-slate-700">
									{store.address}
								</p>
							) : null}

							{store.locationHint ? (
								<p className="rounded-2xl bg-white/70 px-3 py-2 text-xs text-slate-600">
									Petunjuk: {store.locationHint}
								</p>
							) : null}

							<div className="flex flex-wrap gap-2">
								<span className="rounded-full bg-[var(--tf-lavender)] px-3 py-1 text-xs font-semibold text-[var(--tf-purple-dark)]">
									{store.tables.length} meja aktif
								</span>

								<span className="rounded-full bg-[var(--tf-cream)] px-3 py-1 text-xs font-semibold text-[var(--tf-orange-dark)]">
									Mahjong
								</span>
							</div>
						</div>
					</button>
				);
			})}
		</div>
	);
}