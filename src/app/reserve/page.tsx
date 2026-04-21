import { redirect } from "next/navigation";
import { auth } from "@/auth";
import SiteHeader from "@/components/layout/site-header";
import { prisma } from "../../lib/prisma";
import ReserveClient from "./reserve-client";
import { getBookingWindow } from "@/lib/booking-window";

export const dynamic = "force-dynamic";

type ReservePageProps = {
  searchParams: Promise<{
    store?: string;
  }>;
};

export default async function ReservePage({
  searchParams,
}: ReservePageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/reserve");
  }

  const params = await searchParams;
  const requestedStoreId =
    typeof params.store === "string" ? params.store.trim() : "";

  const [rawStores, currentUser] = await Promise.all([
    prisma.store.findMany({
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
        address: true,
        city: true,
        description: true,
        locationHint: true,
        coverImageUrl: true,
        category: true,
        tables: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
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

  const stores = rawStores.map((store) => ({
    id: store.id,
    name: store.name,
    address: store.address,
    city: store.city,
    description: store.description,
    locationHint: store.locationHint,
    coverImageUrl: store.coverImageUrl,
    category: store.category,
    activeTableCount: store.tables.length,
  }));

  const validStoreIds = new Set(stores.map((store) => store.id));
  const initialStoreId = validStoreIds.has(requestedStoreId)
    ? requestedStoreId
    : (stores[0]?.id ?? "");

  const { minDate, maxDate } = getBookingWindow();

  return (
    <div className="min-h-screen bg-[var(--tf-bg)] text-slate-800">
      <SiteHeader />
      <ReserveClient
        stores={stores}
        defaultDate={minDate}
        maxDate={maxDate}
        currentUser={currentUser}
        initialStoreId={initialStoreId}
      />
    </div>
  );
}