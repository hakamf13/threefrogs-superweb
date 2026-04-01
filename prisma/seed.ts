import { PrismaClient, StoreCategory, TableType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const stores = [
    {
      name: "Pakuwon City Mall",
      slug: "mahjong-store-1",
      category: StoreCategory.MAHJONG,
      address: "Surabaya",
      city: "Surabaya",
      description: "Pakuwon City Mall 3 Lantai 2",
      tableCount: 4,
    },
    {
      name: "Pakuwon Mall Homepro",
      slug: "mahjong-store-2",
      category: StoreCategory.MAHJONG,
      address: "Surabaya",
      city: "Surabaya",
      description: "Homepro La Viz",
      tableCount: 6,
    },
    {
      name: "Pakuwon Trade Center",
      slug: "mahjong-store-3",
      category: StoreCategory.MAHJONG,
      address: "Surabaya",
      city: "Surabaya",
      description: "Pakuwon Trade Center Lantai GF",
      tableCount: 4,
    },
    {
      name: "Pakuwon Mall Homepro",
      slug: "mahjong-store-4",
      category: StoreCategory.MAHJONG,
      address: "Surabaya",
      city: "Surabaya",
      description: "Homepro Forest",
      tableCount: 8,
    },
  ];

  for (const storeData of stores) {
    const { tableCount, ...storeFields } = storeData;

    const store = await prisma.store.upsert({
      where: { slug: storeFields.slug },
      update: {
        name: storeFields.name,
        address: storeFields.address,
        city: storeFields.city,
        description: storeFields.description,
        category: storeFields.category,
      },
      create: {
        ...storeFields,
      },
    });

    for (let i = 1; i <= tableCount; i++) {
      await prisma.table.upsert({
        where: {
          storeId_tableNumber: {
            storeId: store.id,
            tableNumber: i,
          },
        },
        update: {},
        create: {
          storeId: store.id,
          tableNumber: i,
          tableCode: `${store.slug.toUpperCase()}-T${String(i).padStart(2, "0")}`,
          tableType: TableType.MAHJONG,
          capacity: 4,
        },
      });
    }
  }

  console.log("Seed selesai: stores dan tables berhasil dibuat.");
}

main()
  .catch((e) => {
    console.error("Seed gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });