import type { IOrderRepository } from "../domain/orders.iface";
import type { ICustomerRepository } from "../../customers/domain/customers.iface";
import type { ISettingsRepository } from "../../settings/domain/settings.iface";
import type { IProductRepository } from "../../products/domain/products.iface";
import type { Order, OrderStatus } from "../domain/order.entity";
import {
  NotFoundError,
  BadRequestError,
} from "../../../shared/presentation/errors";

// Valid status transitions
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["processing", "cancelled"],
  processing: ["ready", "cancelled"],
  ready: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered"],
  delivered: [], // Terminal state
  cancelled: [], // Terminal state
};

export class UpdateOrderUseCase {
  async execute(
    id: string,
    data: {
      status?: OrderStatus;
      driverId?: string;
      receiptImage?: string;
    },
    orderRepo: IOrderRepository,
    customerRepo: ICustomerRepository,
    settingsRepo: ISettingsRepository,
    productRepo: IProductRepository
  ): Promise<Order> {
    // Check if order exists
    const existing = await orderRepo.findById(id);
    if (!existing) {
      throw new NotFoundError([
        {
          path: "order",
          message: "Order not found",
        },
      ]);
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

    // Handle cancellation: restore stock and points
    if (data.status === "cancelled" && existing.status !== "cancelled") {
      await this.restoreStockAndPoints(existing, productRepo, customerRepo);
    }

    // Update order
    const updatedOrder = await orderRepo.update(id, data);

    // If order status changed to "delivered", calculate and update points
    if (data.status === "delivered" && existing.status !== "delivered") {
      await this.updateCustomerPoints(updatedOrder, customerRepo, settingsRepo);
    }

    return updatedOrder;
  }

  private async restoreStockAndPoints(
    order: Order,
    productRepo: IProductRepository,
    customerRepo: ICustomerRepository
  ): Promise<void> {
    // Restore stock for all items
    for (const item of order.items) {
      const product = await productRepo.findById(item.id);
      if (product) {
        await productRepo.update(item.id, {
          stock: product.stock + item.quantity,
        });
      }
    }

    // Restore points if points were used
    if (order.pointsUsed && order.pointsUsed > 0) {
      const customer = await customerRepo.findByPhone(order.phone);
      if (customer) {
        await customerRepo.update(order.phone, {
          pointsDelta: order.pointsUsed,
        });
      }
    }
  }

  private async updateCustomerPoints(
    order: Order,
    customerRepo: ICustomerRepository,
    settingsRepo: ISettingsRepository
  ): Promise<void> {
    // Get store settings for points calculation
    const settings = await settingsRepo.find();
    if (!settings || !settings.pointsSystem?.active) {
      return; // Points system not active
    }

    const customer = await customerRepo.findByPhone(order.phone);
    if (!customer) {
      return; // Customer not found
    }

    // Calculate points earned: floor(total / pointsSystem.value)
    const totalAmount = parseFloat(order.total);
    const pointsEarned = Math.floor(
      totalAmount / (settings.pointsSystem.value || 1)
    );

    // Points used was already deducted at order creation
    // Now we only add the earned points
    if (pointsEarned > 0) {
      await customerRepo.update(order.phone, {
        pointsDelta: pointsEarned,
      });
    }

    // Update total spent and total orders
    const currentTotalSpent = customer.totalSpent
      ? parseFloat(customer.totalSpent)
      : 0;
    const currentTotalOrders = customer.totalOrders || 0;

    await customerRepo.upsert({
      phone: order.phone,
      totalSpent: currentTotalSpent + totalAmount,
      totalOrders: currentTotalOrders + 1,
    });
  }
}
