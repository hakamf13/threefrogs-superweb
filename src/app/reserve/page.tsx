import { prisma } from "../../../lib/prisma";
import { getTodayDateString } from "../../../lib/utils";
import ReserveClient from "./reserve-client";

export default async function ReservePage() {
  const stores = await prisma.store.findMany({
    where: {
      isActive: true,
      category: "MAHJONG",
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      tables: {
        where: {
          isActive: true,
        },
        orderBy: {
          tableNumber: "asc",
        },
        select: {
          id: true,
          tableNumber: true,
          tableCode: true,
          capacity: true,
        },
      },
    },
  });

  return (
    <ReserveClient
      stores={stores}
      defaultDate={getTodayDateString()}
    />
  );
}