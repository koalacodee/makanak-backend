import type { Coupon } from '../domain/coupon.entity'
import type { ICouponRepository } from '../domain/coupon.iface'

export class GetCouponsUseCase {
  async execute(couponRepo: ICouponRepository): Promise<Coupon[]> {
    return await couponRepo.findAll()
  }
}
