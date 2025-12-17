import type { IOrderRepository } from "../domain/orders.iface";
import type { ICustomerRepository } from "../../customers/domain/customers.iface";
import type { ISettingsRepository } from "../../settings/domain/settings.iface";
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
    orderRepo: IOrderRepository,
    customerRepo: ICustomerRepository,
    settingsRepo: ISettingsRepository
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

    // Update order
    const updatedOrder = await orderRepo.update(id, data);

    // If order status changed to "delivered", calculate and update points
    if (data.status === "delivered" && existing.status !== "delivered") {
      await this.updateCustomerPoints(updatedOrder, customerRepo, settingsRepo);
    }

    return updatedOrder;
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
    const pointsUsed = order.pointsUsed || 0;

    // Calculate net points change
    const pointsDelta = pointsEarned - pointsUsed;

    // Update total spent and total orders
    const currentTotalSpent = customer.totalSpent
      ? parseFloat(customer.totalSpent)
      : 0;
    const currentTotalOrders = customer.totalOrders || 0;

    // Update customer: points delta, total spent, and total orders in one operation
    await customerRepo.update(order.phone, {
      pointsDelta: pointsDelta, // Net change in points
    });

    await customerRepo.upsert({
      phone: order.phone,
      totalSpent: currentTotalSpent + totalAmount,
      totalOrders: currentTotalOrders + 1,
    });
  }
}
