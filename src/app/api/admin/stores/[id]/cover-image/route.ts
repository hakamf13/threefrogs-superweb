import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
    const city = typeof body?.city === "string" ? body.city.trim() : "";
    const address =
      typeof body?.address === "string" ? body.address.trim() : "";
    const locationHint =
      typeof body?.locationHint === "string" ? body.locationHint.trim() : "";
    const description =
      typeof body?.description === "string" ? body.description.trim() : "";
    const openingHour = Number(body?.openingHour ?? 11);
    const closingHour = Number(body?.closingHour ?? 22);
    const isActive = Boolean(body?.isActive);

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Nama store dan slug wajib diisi." },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(openingHour) ||
      !Number.isFinite(closingHour) ||
      openingHour < 0 ||
      openingHour > 23 ||
      closingHour < 1 ||
      closingHour > 24 ||
      openingHour >= closingHour
    ) {
      return NextResponse.json(
        { error: "Jam operasional tidak valid." },
        { status: 400 }
      );
    }

    const existing = await prisma.store.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Store tidak ditemukan." },
        { status: 404 }
      );
    }

    const duplicateSlug = await prisma.store.findFirst({
      where: {
        slug,
        id: {
          not: id,
        },
      },
      select: {
        id: true,
      },
    });

    if (duplicateSlug) {
      return NextResponse.json(
        { error: "Slug store sudah dipakai store lain." },
        { status: 409 }
      );
    }

    const updated = await prisma.store.update({
      where: { id },
      data: {
        name,
        slug,
        city: city || null,
        address: address || null,
        locationHint: locationHint || null,
        description: description || null,
        openingHour,
        closingHour,
        isActive,
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      success: true,
      storeId: updated.id,
    });
  } catch (error) {
    console.error("Update store error:", error);

    return NextResponse.json(
      { error: "Gagal mengupdate store." },
      { status: 500 }
    );
  }
}