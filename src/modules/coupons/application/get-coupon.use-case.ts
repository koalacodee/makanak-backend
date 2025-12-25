import type { ICouponRepository } from "../domain/coupon.iface";
import type { Coupon } from "../domain/coupon.entity";
import { NotFoundError } from "../../../shared/presentation/errors";

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
