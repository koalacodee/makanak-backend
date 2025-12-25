import type { ICouponRepository } from "../domain/coupon.iface";
import type { CouponInput, Coupon } from "../domain/coupon.entity";

export class CreateCouponUseCase {
  async execute(
    data: CouponInput,
    couponRepo: ICouponRepository
  ): Promise<Coupon> {
    return await couponRepo.create(data);
  }
}
