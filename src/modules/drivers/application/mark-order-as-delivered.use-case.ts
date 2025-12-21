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

    await redis.srem("busy_drivers", driverId);
    // await redis.rpush("available_drivers", driverId);
    await orderRepo.update(orderId, { status: "delivered" });
    return { success: true };
  }
}
