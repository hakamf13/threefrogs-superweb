import { PrismaClient, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@threefrogs.com";
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
      phone: "081234567890",
    },
    create: {
      name: "Threefrogs Admin",
      email,
      phone: "081234567890",
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  console.log("Admin berhasil dibuat / diupdate:");
  console.log({
    id: admin.id,
    email: admin.email,
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