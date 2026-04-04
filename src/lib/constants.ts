export const OPEN_HOUR = 11;
export const CLOSE_HOUR = 22;
export const PRICE_PER_HOUR = 45000;
export const HALF_HOUR_PRICE = 25000;
export const BOOKING_HOLD_MINUTES = 15;
export const GRACE_PERIOD_MINUTES = 10;

export const TIME_SLOTS = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21] as const;

export const ACTIVE_BOOKING_STATUSES = [
  "AWAITING_PAYMENT",
  "PENDING_VERIFICATION",
  "CONFIRMED",
] as const;