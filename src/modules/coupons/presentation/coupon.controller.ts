import { Elysia, t } from 'elysia'
import { authGuard } from '../../auth/presentation/auth.guard'
import { couponModule } from '../infrastructure/coupon.module'
import { CouponDto, CouponInputDto } from './coupon.dto'

export const couponController = new Elysia({ prefix: '/coupons' })
  .use(couponModule)
  .get(
    '/name/:name',
    async ({ params, getCouponByNameUC, couponRepo }) => {
      const coupon = await getCouponByNameUC.execute(params.name, couponRepo)
      return coupon
    },
    {
      params: t.Object({
        name: t.String(),
      }),
      response: CouponDto,
    },
  )
  .get(
    '/:id',
    async ({ params, getCouponUC, couponRepo }) => {
      const coupon = await getCouponUC.execute(params.id, couponRepo)
      return coupon
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
      response: CouponDto,
    },
  )
  .use(authGuard(['admin']))
  .get(
    '/',
    async ({ getCouponsUC, couponRepo }) => {
      const coupons = await getCouponsUC.execute(couponRepo)
      return coupons
    },
    {
      response: t.Array(CouponDto),
    },
  )
  .post(
    '/',
    async ({ body, createCouponUC, couponRepo }) => {
      const result = await createCouponUC.execute(
        {
          name: body.name,
          value: body.value,
          remainingUses: body.remainingUses,
        },
        couponRepo,
      )
      return result
    },
    {
      body: CouponInputDto,
      response: CouponDto,
    },
  )
  .put(
    '/:id',
    async ({ params, body, updateCouponUC, couponRepo }) => {
      const updateData: {
        name?: string
        value?: number
        remainingUses?: number
      } = {}
      if (body.name !== undefined) updateData.name = body.name
      if (body.value !== undefined) updateData.value = body.value
      if (body.remainingUses !== undefined)
        updateData.remainingUses = body.remainingUses

      const result = await updateCouponUC.execute(
        params.id,
        updateData,
        couponRepo,
      )
      return result
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
      body: CouponInputDto,
      response: CouponDto,
    },
  )
  .delete(
    '/:id',
    async ({ params, deleteCouponUC, couponRepo }) => {
      await deleteCouponUC.execute(params.id, couponRepo)
      return new Response(null, { status: 204 })
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
    },
  )
