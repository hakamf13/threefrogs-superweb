-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateTable
CREATE TABLE "StoreOperatingHour" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "openHour" INTEGER,
    "closeHour" INTEGER,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreOperatingHour_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoreOperatingHour_storeId_idx" ON "StoreOperatingHour"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreOperatingHour_storeId_dayOfWeek_key" ON "StoreOperatingHour"("storeId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "StoreOperatingHour" ADD CONSTRAINT "StoreOperatingHour_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
