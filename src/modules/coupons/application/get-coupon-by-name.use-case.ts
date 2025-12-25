import type { ICouponRepository } from "../domain/coupon.iface";
import type { Coupon } from "../domain/coupon.entity";
import { NotFoundError } from "../../../shared/presentation/errors";

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
