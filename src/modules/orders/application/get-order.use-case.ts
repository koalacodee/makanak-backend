import type { IOrderRepository } from "../domain/orders.iface";
import type { Order } from "../domain/order.entity";
import { NotFoundError } from "../../../shared/presentation/errors";

export class GetOrderUseCase {
  async execute(id: string, repo: IOrderRepository): Promise<Order> {
    const order = await repo.findById(id);
    if (!order) {
      throw new NotFoundError([
        {
          path: "order",
          message: "Order not found",
        },
      ]);
    }
    return order;
  }
}
