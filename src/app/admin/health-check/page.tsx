import { getMahjongHealthCheck } from "@/features/reservations/get-mahjong-health-check";
import HealthCheckBoard from "./health-check-board";

export const dynamic = "force-dynamic";

export default async function HealthCheckPage() {
	const data = await getMahjongHealthCheck();

	return <HealthCheckBoard data={data} />;
}