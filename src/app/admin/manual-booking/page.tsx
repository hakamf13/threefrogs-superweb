import { prisma } from "../../../lib/prisma";
import { getBookingWindow } from "@/lib/booking-window";
import AdminManualBookingForm from "./manual-booking-form";

export const dynamic = "force-dynamic";

export default async function AdminManualBookingPage() {
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

  const { minDate, maxDate } = getBookingWindow();

  return (
    <AdminManualBookingForm
      stores={stores}
      defaultDate={minDate}
      maxDate={maxDate}
    />
  );
}