import { ICustomerRepository } from "@/modules/customers/domain/customers.iface";
import { Order, OrderStatus } from "../domain/order.entity";
import { IOrderRepository } from "../domain/orders.iface";
import { ISettingsRepository } from "@/modules/settings/domain/settings.iface";
import { IProductRepository } from "@/modules/products/domain/products.iface";
import { BadRequestError, NotFoundError } from "@/shared/presentation";

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["processing", "cancelled"],
  processing: ["ready", "cancelled"],
  ready: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered"],
  delivered: [], // Terminal state
  cancelled: [], // Terminal state
};

export class ChangeOrderStatusUseCase {
  async execute(
    data: { id: string; status: OrderStatus },
    orderRepo: IOrderRepository,
    customerRepo: ICustomerRepository,
    settingsRepo: ISettingsRepository,
    productRepo: IProductRepository
  ): Promise<Order> {
    const existing = await orderRepo.findById(data.id);
    const settings = await settingsRepo.find();
    if (!existing) {
      throw new NotFoundError([{ path: "order", message: "Order not found" }]);
    }

    if (existing.status === data.status) {
      return existing;
    }

    // Validate status transition if status is being changed
    if (data.status && data.status !== existing.status) {
      const allowedTransitions = VALID_TRANSITIONS[existing.status];
      if (!allowedTransitions.includes(data.status)) {
        throw new BadRequestError([
          {
            path: "status",
            message: `Invalid status transition from "${existing.status}" to "${
              data.status
            }". Allowed transitions: ${
              allowedTransitions.join(", ") || "none"
            }`,
          },
        ]);
      }
    }

    if (data.status == "delivered") {
      const cashToBePaid =
        existing.total - parseFloat(existing.pointsDiscount ?? "0");
      const pointsToBeEarned = Math.floor(
        cashToBePaid / (settings?.pointsSystem?.value || 1)
      );
      const pointsDelta = pointsToBeEarned - (existing.pointsUsed ?? 0);
      await Promise.all([
        customerRepo.update(existing.phone, {
          pointsDelta,
        }),
        productRepo.updateStockMany(
          existing.orderItems.map((item) => ({
            id: item.productId,
            delta: -item.quantity,
          }))
        ),
      ]);
    }

    return await orderRepo.update(data.id, {
      status: data.status,
      deliveredAt: data.status === "delivered" ? new Date() : undefined,
    });
  }
}
