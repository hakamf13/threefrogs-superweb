import { prisma } from "../../../lib/prisma";
import AdminAvailabilityBoard from "./availability-board";

export const dynamic = "force-dynamic";

function getTodayDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function AdminAvailabilityPage() {
  const stores = await prisma.store.findMany({
    where: {
      isActive: true,
      category: "MAHJONG",
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return (
    <AdminAvailabilityBoard
      stores={stores}
      defaultDate={getTodayDateString()}
    />
  );
}