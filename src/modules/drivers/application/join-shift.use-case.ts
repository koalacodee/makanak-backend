import type { IOrderRepository } from "../../orders/domain/orders.iface";
import { BadRequestError } from "@/shared/presentation";
import redis from "@/shared/redis";
import { assignFirstIdleReadyOrderToFirstIdleDriver } from "./mark-order-as-delivered.use-case";
import { Order, OrderStatus } from "@/modules/orders/domain/order.entity";

export class JoinShiftUseCase {
  async execute(
    driverId: string,
    orderRepo: IOrderRepository
  ): Promise<{
    success: boolean;
    readyOrders: (Order & { shouldTake: number | null })[];
    counts: { status: OrderStatus; count: number }[];
  }> {
    await ensureDriverInAvailableDrivers(driverId);
    const readyOrders = await orderRepo.getReadyOrdersForDriver(driverId);

    if (readyOrders.orders.length === 0) {
      const result = await assignFirstIdleReadyOrderToFirstIdleDriver();
      if (result) {
        const order = await orderRepo.update(result.orderId, {
          driverId: result.driverId,
        });
        readyOrders.orders.push(order);
      }
    }

    return {
      success: true,
      readyOrders: readyOrders.orders.map((order) => ({
        ...order,
        shouldTake: order.paymentMethod === "cod" ? order.total : null,
      })),
      counts: readyOrders.counts,
    };
  }
}

async function ensureDriverInAvailableDrivers(driverId: string) {
  const luaScript = `
    local driverId = ARGV[1]
    local listKey = KEYS[1]

    -- Check if the driverId is already in the list
    local index = redis.call("LPOS", listKey, driverId)

    if index then
      -- DriverId is already in the list, return 0 to indicate no action taken
      return 0
    else
      -- DriverId is not in the list, add it and return 1 to indicate it was added
      redis.call("RPUSH", listKey, driverId)
      return 1
    end
  `;
  const result = await redis.send("EVAL", [
    luaScript,
    "1",
    "available_drivers",
    driverId,
  ]);

  // Handle the result
  if (result === 1) {
    console.log(`Driver ${driverId} was added to the list.`);
  } else {
    console.log(`Driver ${driverId} is already in the list.`);
  }
}
