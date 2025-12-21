import type { IOrderRepository } from "../../orders/domain/orders.iface";
import redis from "@/shared/redis";
import { BadRequestError, NotFoundError } from "@/shared/presentation";
import { DriverSocketService } from "../infrastructure/driver-socket.service";

export class MarkAsReadyUseCase {
  async execute(
    orderId: string,
    orderRepo: IOrderRepository,
    driverSocketService: DriverSocketService
  ): Promise<{ success: boolean; driverId?: string }> {
    const order = await orderRepo.findById(orderId);

    if (!order) {
      throw new NotFoundError([
        { path: "orderId", message: "Order not found" },
      ]);
    }

    if (order.driverId !== null && order.driverId !== undefined) {
      throw new BadRequestError([
        { path: "orderId", message: "Order is already assigned to a driver" },
      ]);
    }

    const driverId = await assignDriverAtomic();

    if (driverId) {
      // Update order with driverId
      await orderRepo.update(orderId, { driverId });

      driverSocketService.pushToDriver(driverId, {
        type: "order_assigned",
        order: {
          orderId: order.id,
          shouldTake: order.paymentMethod === "cod" ? order.total : null,
          customerName: order.customerName,
          customerAddress: order.address,
        },
      });

      return { success: true, driverId: driverId };
    }

    return { success: true, driverId: undefined };
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

    -- رجّعه تاني (لسه idle/assigned)
    redis.call("RPUSH", KEYS[1], driverId)

    return driverId
  `;
  const result = await redis.send("EVAL", [
    luaScript, // الـ script نفسه
    "2", // عدد الـ keys اللي هتستخدمها
    "available_drivers", // KEYS[1]
    "busy_drivers", // KEYS[2]
    // مفيش ARGV في المثال ده
  ]);

  return result; // هيكون driverId أو null
}
