import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "../../../../lib/prisma";
import { getAdminAvailabilityByStoreAndDate } from "@/features/reservations/get-admin-availability";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    const bookingDate = searchParams.get("bookingDate");

    if (!storeId || !bookingDate) {
      return NextResponse.json(
        { error: "storeId dan bookingDate wajib diisi." },
        { status: 400 }
      );
    }

    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        isActive: true,
        category: "MAHJONG",
      },
      select: {
        id: true,
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Store tidak ditemukan." },
        { status: 404 }
      );
    }

    const data = await getAdminAvailabilityByStoreAndDate(storeId, bookingDate);

    return NextResponse.json(
      { data },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Admin availability error:", error);

    return NextResponse.json(
      { error: "Gagal mengambil data availability admin." },
      { status: 500 }
    );
  }
}