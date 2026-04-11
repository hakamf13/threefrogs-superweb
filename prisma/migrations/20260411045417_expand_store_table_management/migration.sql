-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "closingHour" INTEGER DEFAULT 22,
ADD COLUMN     "openingHour" INTEGER DEFAULT 11;

-- AlterTable
ALTER TABLE "Table" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "sortOrder" INTEGER DEFAULT 0;
