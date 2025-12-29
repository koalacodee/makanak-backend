import { type Static, t } from "elysia";

export const CouponDto = t.Object({
	id: t.String({ format: "uuid" }),
	name: t.String(),
	value: t.Number(),
	remainingUses: t.Number(),
});

export const CouponInputDto = t.Object({
	name: t.String(),
	value: t.Number(),
	remainingUses: t.Number(),
});

export type Coupon = Static<typeof CouponDto>;
export type CouponInput = Static<typeof CouponInputDto>;
