import { Elysia, t } from 'elysia'
import { authGuard } from '@/modules/auth'
import { OrderDto } from '@/modules/orders/presentation/orders.dto'
import { driverSocketService } from '../infrastructure/driver-socket.service'
import { driversModule } from '../infrastructure/drivers.module'
import {
  JoinShiftResponseDto,
  MarkAsReadyResponseDto,
  SuccessResponseDto,
} from './drivers.dto'

export const driversController = new Elysia({ prefix: '/driver' })
  .use(driversModule)
  .macro({
    auth: {
      async resolve({ query, accessJwt }) {
        const token = (query as { token?: string }).token

        if (token) {
          try {
            const payload = await accessJwt.verify(token)

            if (
              payload &&
              typeof payload === 'object' &&
              'sub' in payload &&
              'role' in payload
            ) {
              const role = payload.role as string
              if (role === 'driver') {
                return {
                  driverId: payload.sub as string,
                  session: payload,
                }
              }
            }
          } catch (_error) {
            // Token verification failed
            return { driverId: null, session: null }
          }
        }

        return { driverId: null, session: null }
      },
    },
  })
  .ws('/ws', {
    query: t.Object({
      token: t.String(),
    }),
    auth: true,
    async open(ws) {
      const { driverId, session } = ws.data as {
        driverId: string | null
        session: unknown
      }

      if (!driverId || !session) {
        return ws.close(1008, 'Unauthorized')
      }
    },
    async close(ws) {
      const { driverId } = ws.data as {
        driverId: string | null
        session: unknown
      }
      if (driverId) {
        driverSocketService.removeDriverSocket(driverId)
      }
    },
    message(ws, message) {
      // Echo back or handle incoming messages
      ws.send(JSON.stringify({ type: 'ack', received: message }))
    },
  })
  .use(authGuard(['driver', 'inventory']))
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
