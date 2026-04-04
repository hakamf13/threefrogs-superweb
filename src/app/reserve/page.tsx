import { redirect } from "next/navigation";
import { auth } from "@/auth";
import SiteHeader from "@/components/layout/site-header";
import { prisma } from "../../lib/prisma";
import { getTodayDateString } from "../../lib/utils";
import ReserveClient from "./reserve-client";
import { getBookingWindow } from "@/lib/booking-window";

export default async function ReservePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/reserve");
  }

  const [stores, currentUser] = await Promise.all([
    prisma.store.findMany({
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
    }),
    prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
      },
    }),
  ]);

  if (!currentUser) {
    redirect("/login?callbackUrl=/reserve");
  }

  const { minDate, maxDate } = getBookingWindow();

  return (
    <div className="min-h-screen bg-[#F8F4FF] text-slate-800">
      <SiteHeader />
      <ReserveClient
        stores={stores}
        defaultDate={minDate}
        maxDate={maxDate}
        currentUser={currentUser}
      />
    </div>
  );
}