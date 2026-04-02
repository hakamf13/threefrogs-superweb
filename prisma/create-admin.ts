import { PrismaClient, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";
import { normalizePhoneNumber } from "../src/lib/identity";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@threefrogs.com";
  const rawPhone = "08132566996";
  const phone = normalizePhoneNumber(rawPhone);
  const password = "Admin12345!";
  const passwordHash = await hash(password, 10);

  const admin = await prisma.user.upsert({
    where: {
      email,
    },
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
  });

  console.log("Admin berhasil dibuat / diupdate:");
  console.log({
    id: admin.id,
    email: admin.email,
    phone: admin.phone,
    role: admin.role,
    password: password,
  });
}

main()
  .catch((e) => {
    console.error("Gagal membuat admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });