import type { IOrderRepository } from "../domain/orders.iface";
import type { Order, OrderStatus } from "../domain/order.entity";
import { NotFoundError } from "../../../shared/presentation/errors";

export class UpdateOrderUseCase {
  async execute(
    id: string,
    data: {
      status?: OrderStatus;
      driverId?: string;
      receiptImage?: string;
    },
    repo: IOrderRepository
  ): Promise<Order> {
    // Check if order exists
    const existing = await repo.findById(id);
    if (!existing) {
      throw new NotFoundError([
        {
          path: "order",
          message: "Order not found",
        },
      ]);
    }

    return await repo.update(id, data);
  }
}
