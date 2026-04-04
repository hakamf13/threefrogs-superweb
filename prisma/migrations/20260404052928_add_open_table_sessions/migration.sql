-- CreateEnum
CREATE TYPE "OpenTableSessionStatus" AS ENUM ('OPEN', 'CLOSED', 'CANCELLED');

-- CreateTable
CREATE TABLE "OpenTableSession" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "notes" TEXT,
    "status" "OpenTableSessionStatus" NOT NULL DEFAULT 'OPEN',
    "openedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "billedHours" INTEGER,
    "pricePerHour" INTEGER NOT NULL DEFAULT 45000,
    "totalPrice" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpenTableSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OpenTableSession_storeId_status_idx" ON "OpenTableSession"("storeId", "status");

-- CreateIndex
CREATE INDEX "OpenTableSession_tableId_status_idx" ON "OpenTableSession"("tableId", "status");

-- AddForeignKey
ALTER TABLE "OpenTableSession" ADD CONSTRAINT "OpenTableSession_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenTableSession" ADD CONSTRAINT "OpenTableSession_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE CASCADE ON UPDATE CASCADE;
