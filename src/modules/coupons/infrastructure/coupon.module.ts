import { Elysia } from 'elysia'
import db from '../../../drizzle'
import { CreateCouponUseCase } from '../application/create-coupon.use-case'
import { DeleteCouponUseCase } from '../application/delete-coupon.use-case'
import { GetCouponUseCase } from '../application/get-coupon.use-case'
import { GetCouponByNameUseCase } from '../application/get-coupon-by-name.use-case'
import { GetCouponsUseCase } from '../application/get-coupons.use-case'
import { UpdateCouponUseCase } from '../application/update-coupon.use-case'
import { CouponRepository } from './coupon.repository'

export const couponModule = new Elysia({ name: 'couponModule' })
  .decorate('couponRepo', new CouponRepository(db))
  .decorate('getCouponsUC', new GetCouponsUseCase())
  .decorate('getCouponUC', new GetCouponUseCase())
  .decorate('getCouponByNameUC', new GetCouponByNameUseCase())
  .decorate('createCouponUC', new CreateCouponUseCase())
  .decorate('updateCouponUC', new UpdateCouponUseCase())
  .decorate('deleteCouponUC', new DeleteCouponUseCase())
