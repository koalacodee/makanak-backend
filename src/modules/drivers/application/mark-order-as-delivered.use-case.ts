import type { IOrderRepository } from "../../orders/domain/orders.iface";
import redis from "@/shared/redis";
import { UnauthorizedError, NotFoundError } from "@/shared/presentation";

export class MarkOrderAsDeliveredUseCase {
  async execute(
    orderId: string,
    driverId: string,
    orderRepo: IOrderRepository
  ): Promise<{ success: boolean }> {
    const order = await orderRepo.findById(orderId);

    if (!order) {
      throw new NotFoundError([
        { path: "orderId", message: "Order not found" },
      ]);
    }

    if (order.driverId !== driverId) {
      throw new UnauthorizedError([
        { path: "orderId", message: "Order is not assigned to this driver" },
      ]);
    }

    await orderRepo.update(orderId, { status: "delivered" });

    const result = await assignFirstIdleReadyOrderToFirstIdleDriver();
    if (result) {
      await orderRepo.update(result.orderId, { driverId: result.driverId });
      return { success: true };
    } else {
      await redis.srem("busy_drivers", driverId);
      return { success: true };
    }
  }
}

export async function assignFirstIdleReadyOrderToFirstIdleDriver() {
  const lua = `
    local driverId = redis.call("LPOP", KEYS[1])
    local orderId = redis.call("LPOP", KEYS[2])

    if not driverId then
      return redis.error_reply("No driver available")
    end

    if not orderId then
      -- Return driver to queue since no order available
      redis.call("RPUSH", KEYS[1], driverId)
      return redis.error_reply("No order available")
    end
    
    redis.call("RPUSH", KEYS[1], driverId)
    redis.call("SADD", KEYS[3], driverId)

    return { driverId, orderId }
  `;

  try {
    const result = await redis.send("EVAL", [
      lua,
      "3",
      "available_drivers",
      "idle_ready_orders",
      "busy_drivers",
    ]);

    if (Array.isArray(result)) {
      return { driverId: result[0], orderId: result[1] };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error executing Lua script:", error);
    return null;
  }
}
