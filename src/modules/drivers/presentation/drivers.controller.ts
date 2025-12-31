import { Elysia, t } from 'elysia'
import { authGuard } from '@/modules/auth'
import {
  OrderDto,
  OrderStatusEnum,
} from '@/modules/orders/presentation/orders.dto'
import { driversModule } from '../infrastructure/drivers.module'
import {
  JoinShiftResponseDto,
  MarkAsReadyResponseDto,
  SuccessResponseDto,
} from './drivers.dto'

export const driversController = new Elysia({ prefix: '/driver' })
  .use(driversModule)
  .use(authGuard(['driver', 'inventory']))
  .get(
    '/check-driver-status',
    async ({ user, checkDriverStatusUC, orderRepo }) => {
      const result = await checkDriverStatusUC.execute(user.id, orderRepo)
      return {
        isShifted: result.isShifted,
        isBusy: result.isBusy,
        readyOrders: result.readyOrders?.map((order) => ({
          ...order,
          pointsDiscount: order.pointsDiscount
            ? parseFloat(order.pointsDiscount)
            : undefined,
        })),
        counts: result.counts,
      }
    },
    {
      response: t.Object({
        isShifted: t.Boolean(),
        isBusy: t.Boolean(),
        readyOrders: t.Optional(t.Array(OrderDto)),
        counts: t.Optional(
          t.Array(
            t.Object({
              status: OrderStatusEnum,
              count: t.Number(),
            }),
          ),
        ),
      }),
    },
  )
  .post(
    '/join-shift',
    async ({ user, joinShiftUC, orderRepo }) => {
      const result = await joinShiftUC.execute(user.id, orderRepo)
      return {
        success: result.success,
        readyOrders: result.readyOrders.map((order) => ({
          ...order,
          items: order.orderItems.map((item) => ({
            ...item,
            originalPrice: item.price ?? undefined,
          })),
          subtotal: order.subtotal ?? undefined,
          deliveryFee: order.deliveryFee ?? undefined,
          total: order.total,
          driverId: order.driverId ?? undefined,
          createdAt: order.createdAt,
          referenceCode: order.referenceCode ?? undefined,
          deliveredAt: order.deliveredAt ?? undefined,
          date: order.date ?? undefined,
          timestamp: order.timestamp ?? undefined,
          deliveryTimestamp: order.deliveryTimestamp ?? undefined,
          paymentMethod: order.paymentMethod ?? undefined,
          pointsUsed: order.pointsUsed ?? undefined,
          pointsDiscount: order.pointsDiscount
            ? parseFloat(order.pointsDiscount)
            : undefined,
          status: order.status,
          shouldTake: order.shouldTake,
        })),
        counts: result.counts,
      }
    },
    {
      response: JoinShiftResponseDto,
    },
  )
  .post(
    '/leave-shift',
    async ({ user, leaveShiftUC }) => {
      const result = await leaveShiftUC.execute(user.id)
      return result
    },
    {
      response: SuccessResponseDto,
    },
  )
  .post(
    '/take-order/:orderId',
    async ({ params, user, takeOrderUC, orderRepo }) => {
      const result = await takeOrderUC.execute(
        params.orderId,
        user.id,
        orderRepo,
      )
      return {
        ...result,
        items: result.orderItems.map((item) => ({
          ...item,
          originalPrice: item.price ?? undefined,
        })),
        pointsDiscount: result.pointsDiscount
          ? parseFloat(result.pointsDiscount)
          : undefined,
      }
    },
    {
      params: t.Object({
        orderId: t.String(),
      }),
      response: OrderDto,
    },
  )
  .post(
    '/mark-order-as-delivered/:orderId',
    async ({
      params,
      body,
      user,
      markOrderAsDeliveredUC,
      orderRepo,
      customerRepo,
      productRepo,
      couponRepo,
      changeOrderStatusUC,
      markAsReadyUC,
    }) => {
      const result = await markOrderAsDeliveredUC.execute(
        params.orderId,
        user.id,
        body.verificationCode,
        orderRepo,
        customerRepo,
        productRepo,
        couponRepo,
        changeOrderStatusUC,
        markAsReadyUC,
      )
      return result
    },
    {
      params: t.Object({
        orderId: t.String(),
      }),
      body: t.Object({
        verificationCode: t.String(),
      }),
      response: SuccessResponseDto,
      user: t.Object({
        id: t.String(),
      }),
    },
  )
  .post(
    '/mark-as-ready/:orderId',
    async ({ params, markAsReadyUC, orderRepo }) => {
      const result = await markAsReadyUC.execute(params.orderId, orderRepo)
      return result
    },
    {
      params: t.Object({
        orderId: t.String(),
      }),
      response: MarkAsReadyResponseDto,
    },
  )
  .post(
    '/cancel-order/:orderId',
    async ({
      params,
      body,
      user,
      cancelOrderUC,
      orderRepo,
      productRepo,
      couponRepo,
      customerRepo,
      changeOrderStatusUC,
      markAsReadyUC,
    }) => {
      const result = await cancelOrderUC.execute(
        params.orderId,
        user.id,
        body.cancellation,
        orderRepo,
        productRepo,
        couponRepo,
        customerRepo,
        changeOrderStatusUC,
        markAsReadyUC,
      )
      return {
        order: {
          ...result.order,
          pointsDiscount: result.order.pointsDiscount
            ? parseFloat(result.order.pointsDiscount)
            : undefined,
        },
        cancellationPutUrl: result.cancellationPutUrl,
      }
    },
    {
      params: t.Object({
        orderId: t.String(),
      }),
      body: t.Object({
        cancellation: t.Object({
          reason: t.Optional(t.String()),
          attachWithFileExtension: t.Optional(t.String()),
        }),
      }),
      response: t.Object({
        order: OrderDto,
        cancellationPutUrl: t.Optional(t.String()),
      }),
      user: t.Object({
        id: t.String(),
      }),
    },
  )
