import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "../../../../../../lib/prisma";

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
    const body = await request.json();

    const { coverImageUrl, coverImagePublicId } = body as {
      coverImageUrl?: string;
      coverImagePublicId?: string;
    };

    if (!coverImageUrl) {
      return NextResponse.json(
        { error: "coverImageUrl wajib diisi." },
        { status: 400 }
      );
    }

    const store = await prisma.store.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Store tidak ditemukan." },
        { status: 404 }
      );
    }

    await prisma.store.update({
      where: { id },
      data: {
        coverImageUrl,
        coverImagePublicId: coverImagePublicId || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update store cover image error:", error);

    return NextResponse.json(
      { error: "Gagal mengupdate cover image store." },
      { status: 500 }
    );
  }
}