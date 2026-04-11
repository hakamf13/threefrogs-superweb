-- CreateEnum
CREATE TYPE "WalkInSessionStatus" AS ENUM ('ACTIVE', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WalkInPaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');

-- AlterTable
ALTER TABLE "Booking" ALTER COLUMN "customerPhone" DROP NOT NULL;

-- CreateTable
CREATE TABLE "WalkInSession" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "notes" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "estimatedEndAt" TIMESTAMP(3) NOT NULL,
    "actualEndedAt" TIMESTAMP(3),
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "status" "WalkInSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "paymentStatus" "WalkInPaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "paymentNote" TEXT,
    "createdByAdminId" TEXT,
    "closedByAdminId" TEXT,
    "durationMinutes" INTEGER,
    "billedMinutes" INTEGER,
    "totalPrice" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalkInSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WalkInSession_storeId_bookingDate_status_idx" ON "WalkInSession"("storeId", "bookingDate", "status");

-- CreateIndex
CREATE INDEX "WalkInSession_tableId_bookingDate_status_idx" ON "WalkInSession"("tableId", "bookingDate", "status");

-- CreateIndex
CREATE INDEX "WalkInSession_startedAt_estimatedEndAt_idx" ON "WalkInSession"("startedAt", "estimatedEndAt");

-- AddForeignKey
ALTER TABLE "WalkInSession" ADD CONSTRAINT "WalkInSession_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalkInSession" ADD CONSTRAINT "WalkInSession_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
