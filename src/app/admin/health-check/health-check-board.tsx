import Link from "next/link";
import { formatDateTimeDisplay } from "@/lib/utils";

type HealthCheckBoardProps = {
	data: {
		now: Date;
		today: string;
		currentHour: number;
		summary: {
			activeStores: number;
			activeTables: number;
			openSessions: number;
			overdueAwaitingPayment: number;
			bookingsWithoutSlots: number;
			confirmedWithoutConfirmedAt: number;
			duplicateOpenTables: number;
			openTableConflictsWithBooking: number;
		};
		checks: ReadonlyArray<{
			key: string;
			label: string;
			status: "PASS" | "WARN" | "FAIL";
			detail: string;
		}>;
		details: {
			duplicateOpenTables: Array<{
				tableId: string;
				sessionCount: number;
				sessionIds: string[];
			}>;
			openTableConflictsWithBooking: Array<{
				sessionId: string;
				tableId: string;
				customerName: string;
				openedAt: Date;
			}>;
		};
	};
};

function getStatusStyle(status: "PASS" | "WARN" | "FAIL") {
	switch (status) {
		case "PASS":
			return "border-green-200 bg-green-50 text-green-800";
		case "WARN":
			return "border-orange-200 bg-orange-50 text-orange-800";
		case "FAIL":
			return "border-red-200 bg-red-50 text-red-800";
		default:
			return "border-slate-200 bg-slate-50 text-slate-700";
	}
}

export default function HealthCheckBoard({
	data,
}: HealthCheckBoardProps) {
	return (
		<main className="min-h-screen bg-[var(--tf-bg)] px-4 py-12 text-slate-800 sm:px-6 sm:py-16">
			<div className="mx-auto max-w-7xl space-y-8">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
					<div>
						<p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
							Mahjong Health Check
						</p>
						<h1 className="mt-3 text-4xl font-black text-[var(--tf-purple)]">
							Final Readiness Check
						</h1>
						<p className="mt-2 text-slate-600">
							Snapshot sistem saat ini • {formatDateTimeDisplay(data.now)}
						</p>
					</div>

					<div className="flex flex-wrap gap-3">
						<Link
							href="/admin/today-operations"
							className="rounded-2xl bg-[var(--tf-purple)] px-5 py-3 font-bold text-white transition hover:bg-[var(--tf-purple-dark)]"
						>
							Today Ops
						</Link>
						<Link
							href="/admin/open-tables"
							className="rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-700"
						>
							Open Tables
						</Link>
						<Link
							href="/admin"
							className="rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-700"
						>
							Dashboard
						</Link>
					</div>
				</div>

				<section className="grid gap-4 md:grid-cols-4 xl:grid-cols-8">
					<div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[var(--tf-shadow-card)]">
						<p className="text-sm text-slate-500">Store aktif</p>
						<p className="mt-2 text-3xl font-black text-[var(--tf-purple)]">
							{data.summary.activeStores}
						</p>
					</div>

					<div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[var(--tf-shadow-card)]">
						<p className="text-sm text-slate-500">Meja aktif</p>
						<p className="mt-2 text-3xl font-black text-[var(--tf-purple)]">
							{data.summary.activeTables}
						</p>
					</div>

					<div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[var(--tf-shadow-card)]">
						<p className="text-sm text-slate-500">Open session</p>
						<p className="mt-2 text-3xl font-black text-[var(--tf-purple)]">
							{data.summary.openSessions}
						</p>
					</div>

					<div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[var(--tf-shadow-card)]">
						<p className="text-sm text-slate-500">Overdue AWP</p>
						<p className="mt-2 text-3xl font-black text-orange-600">
							{data.summary.overdueAwaitingPayment}
						</p>
					</div>

					<div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[var(--tf-shadow-card)]">
						<p className="text-sm text-slate-500">Booking tanpa slot</p>
						<p className="mt-2 text-3xl font-black text-red-600">
							{data.summary.bookingsWithoutSlots}
						</p>
					</div>

					<div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[var(--tf-shadow-card)]">
						<p className="text-sm text-slate-500">Confirmed tanpa waktu</p>
						<p className="mt-2 text-3xl font-black text-orange-600">
							{data.summary.confirmedWithoutConfirmedAt}
						</p>
					</div>

					<div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[var(--tf-shadow-card)]">
						<p className="text-sm text-slate-500">Duplicate open</p>
						<p className="mt-2 text-3xl font-black text-red-600">
							{data.summary.duplicateOpenTables}
						</p>
					</div>

					<div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[var(--tf-shadow-card)]">
						<p className="text-sm text-slate-500">Open vs booking</p>
						<p className="mt-2 text-3xl font-black text-orange-600">
							{data.summary.openTableConflictsWithBooking}
						</p>
					</div>
				</section>

				<section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
					<div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
						<h2 className="text-2xl font-black text-[var(--tf-purple)]">
							Automated Checks
						</h2>

						<div className="mt-5 space-y-4">
							{data.checks.map((check) => (
								<div
									key={check.key}
									className={`rounded-[1.5rem] border p-5 ${getStatusStyle(
										check.status
									)}`}
								>
									<div className="flex flex-wrap items-center gap-3">
										<span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black">
											{check.status}
										</span>
										<h3 className="text-lg font-black">{check.label}</h3>
									</div>
									<p className="mt-3 text-sm leading-6">{check.detail}</p>
								</div>
							))}
						</div>
					</div>

					<div className="space-y-6">
						<section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--tf-shadow-card)]">
							<h2 className="text-2xl font-black text-[var(--tf-purple)]">
								Manual QA Checklist
							</h2>

							<div className="mt-5 space-y-3 text-sm text-slate-700">
								<div className="rounded-[1.25rem] bg-slate-50 p-4">
									1. Customer login → reserve → booking detail → upload proof
								</div>
								<div className="rounded-[1.25rem] bg-slate-50 p-4">
									2. Admin approve atau reject proof berjalan normal
								</div>
								<div className="rounded-[1.25rem] bg-slate-50 p-4">
									3. Expiry otomatis mengembalikan slot
								</div>
								<div className="rounded-[1.25rem] bg-slate-50 p-4">
									4. Admin direct confirm dan manual booking aman
								</div>
								<div className="rounded-[1.25rem] bg-slate-50 p-4">
									5. Open Table buka → blok meja → close → tagihan benar
								</div>
								<div className="rounded-[1.25rem] bg-slate-50 p-4">
									6. Today Ops menampilkan status meja dengan benar
								</div>
							</div>
						</section>

						{data.details.duplicateOpenTables.length > 0 ? (
							<section className="rounded-[2rem] border border-red-200 bg-red-50 p-6 shadow-[var(--tf-shadow-card)]">
								<h2 className="text-2xl font-black text-red-700">
									Duplicate Open Table
								</h2>

								<div className="mt-4 space-y-3 text-sm text-red-700">
									{data.details.duplicateOpenTables.map((item) => (
										<div
											key={item.tableId}
											className="rounded-[1.25rem] bg-white/70 p-4"
										>
											<p className="font-bold">Table ID: {item.tableId}</p>
											<p>Session count: {item.sessionCount}</p>
											<p>Sessions: {item.sessionIds.join(", ")}</p>
										</div>
									))}
								</div>
							</section>
						) : null}

						{data.details.openTableConflictsWithBooking.length > 0 ? (
							<section className="rounded-[2rem] border border-orange-200 bg-orange-50 p-6 shadow-[var(--tf-shadow-card)]">
								<h2 className="text-2xl font-black text-orange-700">
									Open Table vs Booking Conflict
								</h2>

								<div className="mt-4 space-y-3 text-sm text-orange-700">
									{data.details.openTableConflictsWithBooking.map((item) => (
										<div
											key={item.sessionId}
											className="rounded-[1.25rem] bg-white/70 p-4"
										>
											<p className="font-bold">{item.customerName}</p>
											<p>Table ID: {item.tableId}</p>
											<p>Opened: {formatDateTimeDisplay(item.openedAt)}</p>
										</div>
									))}
								</div>
							</section>
						) : null}
					</div>
				</section>
			</div>
		</main>
	);
}