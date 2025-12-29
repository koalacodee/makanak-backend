import { BadRequestError, NotFoundError } from '@/shared/presentation'
import redis from '@/shared/redis'
import { driversIO } from '@/socket.io'
import type { IOrderRepository } from '../../orders/domain/orders.iface'

export class MarkAsReadyUseCase {
  async execute(
    orderId: string,
    orderRepo: IOrderRepository,
  ): Promise<{ success: boolean; driverId?: string }> {
    const order = await orderRepo.findById(orderId)

    if (!order) {
      throw new NotFoundError([{ path: 'orderId', message: 'Order not found' }])
    }

    if (order.driverId !== null && order.driverId !== undefined) {
      throw new BadRequestError([
        { path: 'orderId', message: 'Order is already assigned to a driver' },
      ])
    }

    const driverId = await assignDriverAtomic()

    if (driverId) {
      // Update order with driverId
      const updatedOrder = await orderRepo.update(orderId, { driverId })
      const shouldTake =
        updatedOrder.paymentMethod === 'cod' ? updatedOrder.total : null
      driversIO.notifyDriverWithReadyOrder(driverId, {
        id: updatedOrder.id,
        customerName: updatedOrder.customerName,
        referenceCode: updatedOrder.referenceCode,
        phone: updatedOrder.phone,
        address: updatedOrder.address,
        orderItems: updatedOrder.orderItems.map((item) => ({
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          productName: item.productName,
          productStock: item.productStock,
        })),
        total: updatedOrder.total,
        status: 'ready',
        createdAt: updatedOrder.createdAt,
        deliveredAt: updatedOrder.deliveredAt,
        date: updatedOrder.date,
        paymentMethod: updatedOrder.paymentMethod,
        pointsUsed: updatedOrder.pointsUsed,
        shouldTake: shouldTake,
      })

      return { success: true, driverId: driverId }
    }

    await redis.rpush('idle_ready_orders', orderId)

    return { success: true, driverId: undefined }
  }
}

async function assignDriverAtomic() {
  const luaScript = `
    -- KEYS[1] = available_drivers
    -- KEYS[2] = busy_drivers
    -- ARGV[1] = max_pending_orders (اختياري)

    local driverId = redis.call("LPOP", KEYS[1])

    if not driverId then
      return nil
    end

    -- لو السائق busy (احتياط)
    if redis.call("SISMEMBER", KEYS[2], driverId) == 1 then
      -- رجّعه تاني للـ queue
      redis.call("RPUSH", KEYS[1], driverId)
      return nil
    end

    -- Mark driver as busy - do NOT put back in available_drivers
    redis.call("SADD", KEYS[2], driverId)

    return driverId
  `
  const result = await redis.send('EVAL', [
    luaScript, // الـ script نفسه
    '2', // عدد الـ keys اللي هتستخدمها
    'available_drivers', // KEYS[1]
    'busy_drivers', // KEYS[2]
    // مفيش ARGV في المثال ده
  ])

  return result // هيكون driverId أو null
}
