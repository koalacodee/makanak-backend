import type { IOrderRepository } from "../domain/orders.iface";
import { NotFoundError, BadRequestError } from "@/shared/presentation";

export class CancelOrderByInventoryUseCase {
  async execute(
    orderId: string,
    cancellationReason: string,
    orderRepo: IOrderRepository
  ): Promise<{ success: boolean }> {
    const order = await orderRepo.findById(orderId);

    if (!order) {
      throw new NotFoundError([
        { path: "orderId", message: "Order not found" },
      ]);
    }

    // Only allow cancelling pending orders
    if (order.status !== "pending") {
      throw new BadRequestError([
        {
          path: "status",
          message: `Order cannot be cancelled by inventory. Current status: ${order.status}. Only orders with status "pending" can be cancelled by inventory.`,
        },
      ]);
    }

    // Directly update order to cancelled status without side effects
    // Since the order is pending, nothing was done yet (no stock reduction, no coupon usage, no points deduction)
    await orderRepo.update(orderId, {
      status: "cancelled",
      cancellationReason,
      cancelledAt: new Date(),
      cancelledBy: "inventory",
    });

    return { success: true };
  }
}
