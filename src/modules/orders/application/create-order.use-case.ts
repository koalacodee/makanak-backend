import type { IOrderRepository } from "../domain/orders.iface";
import type { Order, PaymentMethod } from "../domain/order.entity";
import { BadRequestError } from "../../../shared/presentation/errors";

export class CreateOrderUseCase {
  async execute(
    data: {
      customerName: string;
      phone: string;
      address: string;
      items: Array<{ id: string; quantity: number }>;
      subtotal?: number;
      deliveryFee?: number;
      paymentMethod: PaymentMethod;
      pointsUsed?: number;
      pointsDiscount?: number;
    },
    repo: IOrderRepository
  ): Promise<Order> {
    // Validate items
    if (!data.items || data.items.length === 0) {
      throw new BadRequestError([
        {
          path: "items",
          message: "Order must have at least one item",
        },
      ]);
    }

    // Validate quantities
    for (const item of data.items) {
      if (item.quantity <= 0) {
        throw new BadRequestError([
          {
            path: "items",
            message: `Item ${item.id} must have a quantity greater than 0`,
          },
        ]);
      }
    }

    return await repo.create({
      customerName: data.customerName,
      phone: data.phone,
      address: data.address,
      items: data.items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      })),
      subtotal: data.subtotal?.toString(),
      deliveryFee: data.deliveryFee?.toString(),
      paymentMethod: data.paymentMethod,
      pointsUsed: data.pointsUsed,
      pointsDiscount: data.pointsDiscount?.toString(),
    });
  }
}
