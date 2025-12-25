import type { ICouponRepository } from "../domain/coupon.iface";
import type { CouponInput, Coupon } from "../domain/coupon.entity";
import { NotFoundError } from "../../../shared/presentation/errors";

export class UpdateCouponUseCase {
  async execute(
    id: string,
    data: Partial<CouponInput>,
    couponRepo: ICouponRepository
  ): Promise<Coupon> {
    // Check if coupon exists
    const existing = await couponRepo.findById(id);
    if (!existing) {
      throw new NotFoundError([
        {
          path: "coupon",
          message: "Coupon not found",
        },
      ]);
    }

    return await couponRepo.update(id, data);
  }
}
