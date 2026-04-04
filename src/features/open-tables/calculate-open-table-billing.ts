import { HALF_HOUR_PRICE, PRICE_PER_HOUR } from "@/lib/constants";

export function calculateOpenTableBilling(openedAt: Date, closedAt: Date) {
  const diffMs = closedAt.getTime() - openedAt.getTime();
  const durationMinutes = Math.max(1, Math.ceil(diffMs / 60000));

  if (durationMinutes <= 30) {
    return {
      durationMinutes,
      billedHours: 0.5,
      totalPrice: HALF_HOUR_PRICE,
    };
  }

  const billedHours = Math.ceil(durationMinutes / 60);
  const totalPrice = billedHours * PRICE_PER_HOUR;

  return {
    durationMinutes,
    billedHours,
    totalPrice,
  };
}