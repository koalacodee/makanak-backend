import type { Coupon, CouponInput } from "../domain/coupon.entity";
import type { ICouponRepository } from "../domain/coupon.iface";

export class CreateCouponUseCase {
	async execute(
		data: CouponInput,
		couponRepo: ICouponRepository,
	): Promise<Coupon> {
		return await couponRepo.create(data);
	}
}
