const CAP = 0.5;

// Applies each coupon in turn. Each coupon is capped at 50%.
export function applyDiscounts(price, coupons) {
  return coupons.reduce((p, c) => p * (1 - Math.min(c.rate, CAP)), price);
}
