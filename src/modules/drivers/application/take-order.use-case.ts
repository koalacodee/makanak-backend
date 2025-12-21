import type { IOrderRepository } from "../../orders/domain/orders.iface";
import redis from "@/shared/redis";
import { UnauthorizedError, NotFoundError } from "@/shared/presentation";

export class TakeOrderUseCase {
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

    await redis.sadd("busy_drivers", driverId);
    await redis.lrem("available_drivers", 1, driverId);
    return { success: true };
  }
}
