import { getTodayOperationsBoard } from "@/features/reservations/get-today-operations-board";
import TodayOperationsBoard from "./today-operations-board";

export const dynamic = "force-dynamic";

export default async function TodayOperationsPage() {
  const data = await getTodayOperationsBoard();

  return <TodayOperationsBoard data={data} />;
}