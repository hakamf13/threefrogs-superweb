import { prisma } from "../../../lib/prisma";
import AdminStoreImageManager from "./store-image-manager";

export const dynamic = "force-dynamic";

export default async function AdminStoresPage() {
  const stores = await prisma.store.findMany({
    where: {
      isActive: true,
      category: "MAHJONG",
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      coverImageUrl: true,
      coverImagePublicId: true,
    },
  });
  

  return <AdminStoreImageManager stores={stores} />;
}