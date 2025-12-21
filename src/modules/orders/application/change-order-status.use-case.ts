import { ICustomerRepository } from "@/modules/customers/domain/customers.iface";
import { Order, OrderStatus } from "../domain/order.entity";
import { IOrderRepository } from "../domain/orders.iface";

import { IProductRepository } from "@/modules/products/domain/products.iface";
import { NotFoundError } from "@/shared/presentation";
import { MarkAsReadyUseCase } from "@/modules/drivers/application/mark-as-ready.use-case";
import { driverSocketService } from "@/modules/drivers/infrastructure/driver-socket.service";

export class ChangeOrderStatusUseCase {
  async execute(
    data: { id: string; status: OrderStatus },
    orderRepo: IOrderRepository,
    customerRepo: ICustomerRepository,

    productRepo: IProductRepository,
    markAsReadyUC: MarkAsReadyUseCase
  ): Promise<Order> {
    const existing = await orderRepo.findById(data.id);
    if (!existing) {
      throw new NotFoundError([{ path: "order", message: "Order not found" }]);
    }

    if (existing.status === data.status) {
      return existing;
    }

    // If order is being cancelled, revert all changes made when order was created
    if (data.status === "cancelled" && existing.status !== "cancelled") {
      // Use the order total which is already calculated as subtotal + deliveryFee - pointsDiscount
      const totalAmount = existing.total;

      await Promise.all([
        // Restore stock
        productRepo.updateStockMany(
          existing.orderItems.map((item) => ({
            id: item.productId,
            delta: item.quantity, // Add back the stock
          }))
        ),

        // Restore points (if points were used)
        existing.pointsUsed && existing.pointsUsed > 0
          ? customerRepo.update(existing.phone, {
              pointsDelta: existing.pointsUsed - (existing.pointsEarned ?? 0), // Add back the points
            })
          : Promise.resolve(),
        // Revert customer stats
        customerRepo.update(existing.phone, {
          totalSpentDelta: -totalAmount,
          totalOrdersDelta: -1,
        }),
      ]);
    } else if (data.status == "ready") {
      await markAsReadyUC.execute(data.id, orderRepo, driverSocketService);
    }

    return await orderRepo.update(data.id, {
      status: data.status,
      deliveredAt: data.status === "delivered" ? new Date() : undefined,
    });
  }
}
