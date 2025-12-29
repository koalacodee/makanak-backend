import { NotFoundError } from '../../../shared/presentation/errors'
import type { ICouponRepository } from '../domain/coupon.iface'

export class DeleteCouponUseCase {
  async execute(id: string, couponRepo: ICouponRepository): Promise<void> {
    // Check if coupon exists
    const existing = await couponRepo.findById(id)
    if (!existing) {
      throw new NotFoundError([
        {
          path: 'coupon',
          message: 'Coupon not found',
        },
      ])
    }

    await couponRepo.delete(id)
  }
}
