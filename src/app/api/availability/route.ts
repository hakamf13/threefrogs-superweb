import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getAvailabilityByStoreAndDate } from "@/features/reservations/get-availability";

export async function GET(request: Request) {
  try {
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

    const availability = await getAvailabilityByStoreAndDate(
      storeId,
      bookingDate
    );

    return NextResponse.json({
      data: availability,
    });
  } catch (error) {
    console.error("Availability error:", error);

    return NextResponse.json(
      { error: "Gagal mengambil availability." },
      { status: 500 }
    );
  }
}