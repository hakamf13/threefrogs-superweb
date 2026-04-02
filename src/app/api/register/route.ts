import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "../../../../lib/prisma";
import { registerUserSchema } from "../../../../lib/validations";

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

    const { name, email, phone, password } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar." },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        phone,
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