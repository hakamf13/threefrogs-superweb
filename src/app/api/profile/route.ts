import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "../../../lib/prisma";
import { normalizePhoneNumber } from "@/lib/identity";
import { updateProfileSchema } from "../../../lib/validations";

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Kamu harus login dulu." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ?? "Data profil tidak valid.",
        },
        { status: 400 }
      );
    }

    const { name, phone, email } = parsed.data;

    const normalizedPhone = normalizePhoneNumber(phone);
    const normalizedEmail = email?.trim().toLowerCase() || null;

    if (!normalizedPhone) {
      return NextResponse.json(
        { error: "Nomor HP tidak valid." },
        { status: 400 }
      );
    }

    const conflictUser = await prisma.user.findFirst({
      where: {
        id: {
          not: session.user.id,
        },
        OR: [
          { phone: normalizedPhone },
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
        ],
      },
      select: {
        id: true,
        phone: true,
        email: true,
      },
    });

    if (conflictUser) {
      if (conflictUser.phone === normalizedPhone) {
        return NextResponse.json(
          { error: "Nomor HP sudah digunakan akun lain." },
          { status: 409 }
        );
      }

      if (normalizedEmail && conflictUser.email === normalizedEmail) {
        return NextResponse.json(
          { error: "Email sudah digunakan akun lain." },
          { status: 409 }
        );
      }
    }

    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        name,
        phone: normalizedPhone,
        email: normalizedEmail,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return NextResponse.json(
      { error: "Terjadi kesalahan saat update profil." },
      { status: 500 }
    );
  }
}