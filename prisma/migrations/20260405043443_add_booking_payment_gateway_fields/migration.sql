/*
  Warnings:

  - A unique constraint covering the columns `[paymentReferenceId]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "paymentCheckoutUrl" TEXT,
ADD COLUMN     "paymentExpiredAt" TIMESTAMP(3),
ADD COLUMN     "paymentGatewayPayload" JSONB,
ADD COLUMN     "paymentGatewayProvider" TEXT,
ADD COLUMN     "paymentGatewayStatus" TEXT,
ADD COLUMN     "paymentMethodCode" TEXT,
ADD COLUMN     "paymentReferenceId" TEXT,
ADD COLUMN     "paymentRequestedAt" TIMESTAMP(3),
ADD COLUMN     "paymentSucceededAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_paymentReferenceId_key" ON "Booking"("paymentReferenceId");
