import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "../../../lib/prisma";
import { registerUserSchema } from "../../../lib/validations";
import { normalizePhoneNumber } from "../../../lib/identity";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Data register tidak valid.",
        },
        { status: 400 }
      );
    }

    const { name, phone, email, password } = parsed.data;

    const normalizedPhone = normalizePhoneNumber(phone);
    const normalizedEmail = email?.trim().toLowerCase() || null;

    if (!normalizedPhone) {
      return NextResponse.json(
        { error: "Nomor HP tidak valid." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
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

    if (existingUser) {
      if (existingUser.phone === normalizedPhone) {
        return NextResponse.json(
          { error: "Nomor HP sudah terdaftar." },
          { status: 409 }
        );
      }

      if (normalizedEmail && existingUser.email === normalizedEmail) {
        return NextResponse.json(
          { error: "Email sudah terdaftar." },
          { status: 409 }
        );
      }
    }

    const passwordHash = await hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        phone: normalizedPhone,
        email: normalizedEmail,
        passwordHash,
        role: "USER",
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Register error:", error);

    return NextResponse.json(
      { error: "Terjadi kesalahan saat register." },
      { status: 500 }
    );
  }
}