import type { IOrderRepository } from "../../orders/domain/orders.iface";
import { BadRequestError } from "@/shared/presentation";
import redis from "@/shared/redis";

export class JoinShiftUseCase {
  async execute(
    driverId: string,
    orderRepo: IOrderRepository
  ): Promise<{
    success: boolean;
    readyOrders: Array<{
      orderId: string;
      shouldTake: number | null;
      customerName: string;
      customerAddress: string;
    }>;
  }> {
    const isInShift = await redis.sismember("in_shift_drivers", driverId);
    if (!isInShift) {
      await redis.sadd("in_shift_drivers", driverId);
      await redis.rpush("available_drivers", driverId);
    }

    const readyOrders = await orderRepo.getReadyOrdersForDriver(driverId);

    return { success: true, readyOrders };
  }
}
