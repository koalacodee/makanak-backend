import type { Order, OrderStatus } from '@/modules/orders/domain/order.entity'
import type { IOrderRepository } from '@/modules/orders/domain/orders.iface'
import redis from '@/shared/redis'
import { assignFirstIdleReadyOrderToFirstIdleDriver } from './mark-order-as-delivered.use-case'

export class CheckDriverStatusUseCase {
  async execute(
    driverId: string,
    orderRepo: IOrderRepository,
  ): Promise<{
    isShifted: boolean
    isBusy: boolean
    readyOrders?: Order[]
    counts?: { status: OrderStatus; count: number }[]
  }> {
    const isShifted = await redis.sismember('shift_drivers', driverId)
    if (isShifted) {
      const readyOrders = await orderRepo.getReadyOrdersForDriver(driverId)
      const isBusy = await redis.sismember('busy_drivers', driverId)

      if (readyOrders.orders.length === 0) {
        const result = await assignFirstIdleReadyOrderToFirstIdleDriver()
        if (result) {
          const order = await orderRepo.update(result.orderId, {
            driverId: result.driverId,
          })
          readyOrders.orders.push(order)
        }
      }
      return {
        isShifted: true,
        isBusy: isBusy,
        readyOrders: readyOrders.orders,
        counts: readyOrders.counts,
      }
    }
    return {
      isShifted: false,
      isBusy: false,
      readyOrders: undefined,
      counts: undefined,
    }
  }
}
