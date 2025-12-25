export interface Coupon {
  id: string;
  name: string;
  value: number;
  remainingUses: number;
}

export interface CouponInput {
  name: string;
  value: number;
  remainingUses: number;
}
