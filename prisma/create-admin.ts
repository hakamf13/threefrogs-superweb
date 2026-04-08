import path from "node:path";
import fs from "node:fs";
import dotenv from "dotenv";
import { PrismaClient, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";
import { normalizePhoneNumber } from "../src/lib/identity";

const envPath = path.resolve(process.cwd(), ".env.local");

if (!fs.existsSync(envPath)) {
  throw new Error(
    `File .env.local tidak ditemukan di root project.\n` +
      `Pastikan file ada di: ${envPath}`
  );
}

const dotenvResult = dotenv.config({ path: envPath });

if (dotenvResult.error) {
  throw new Error(
    `Gagal membaca file .env.local di ${envPath}\n` +
      `Detail: ${dotenvResult.error.message}`
  );
}

const prisma = new PrismaClient();

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Environment variable ${name} wajib diisi di file .env.local.\n` +
        `Lokasi yang dibaca: ${envPath}`
    );
  }

  return value;
}

async function main() {
  const email = requireEnv("ADMIN_EMAIL").toLowerCase();
  const rawPhone = requireEnv("ADMIN_PHONE");
  const password = requireEnv("ADMIN_PASSWORD");

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD minimal 8 karakter.");
  }

  const phone = normalizePhoneNumber(rawPhone);

  if (!phone) {
    throw new Error(
      "ADMIN_PHONE tidak valid. Contoh format yang aman: 081234567890"
    );
  }

  const passwordHash = await hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      name: "Threefrogs Admin",
      role: UserRole.ADMIN,
      isActive: true,
      passwordHash,
      phone,
    },
    create: {
      name: "Threefrogs Admin",
      email,
      phone,
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
    },
  });

  console.log("Admin berhasil dibuat / diupdate:");
  console.log(admin);
}

main()
  .catch((error) => {
    console.error("Gagal membuat admin:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });