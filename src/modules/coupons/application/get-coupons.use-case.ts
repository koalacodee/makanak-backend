import type { ICouponRepository } from "../domain/coupon.iface";
import type { Coupon } from "../domain/coupon.entity";

export class GetCouponsUseCase {
  async execute(couponRepo: ICouponRepository): Promise<Coupon[]> {
    return await couponRepo.findAll();
  }
}
