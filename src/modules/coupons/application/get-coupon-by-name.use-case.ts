import { NotFoundError } from "../../../shared/presentation/errors";
import type { Coupon } from "../domain/coupon.entity";
import type { ICouponRepository } from "../domain/coupon.iface";

export class GetCouponByNameUseCase {
	async execute(name: string, couponRepo: ICouponRepository): Promise<Coupon> {
		const coupon = await couponRepo.findByName(name);
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
