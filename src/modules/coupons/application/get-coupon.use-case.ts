import { NotFoundError } from "../../../shared/presentation/errors";
import type { Coupon } from "../domain/coupon.entity";
import type { ICouponRepository } from "../domain/coupon.iface";

export class GetCouponUseCase {
	async execute(id: string, couponRepo: ICouponRepository): Promise<Coupon> {
		const coupon = await couponRepo.findById(id);
		if (!coupon) {
			throw new NotFoundError([
				{
					path: "coupon",
					message: "Coupon not found",
				},
			]);
		}
		return coupon;
	}
}
