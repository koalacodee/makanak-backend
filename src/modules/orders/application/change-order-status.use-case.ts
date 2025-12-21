import { ICustomerRepository } from "@/modules/customers/domain/customers.iface";
import { Order, OrderStatus } from "../domain/order.entity";
import { IOrderRepository } from "../domain/orders.iface";
import { ISettingsRepository } from "@/modules/settings/domain/settings.iface";
import { IProductRepository } from "@/modules/products/domain/products.iface";
import { BadRequestError, NotFoundError } from "@/shared/presentation";
import { MarkAsReadyUseCase } from "@/modules/drivers/application/mark-as-ready.use-case";
import { driverSocketService } from "@/modules/drivers/infrastructure/driver-socket.service";

export class ChangeOrderStatusUseCase {
  async execute(
    data: { id: string; status: OrderStatus },
    orderRepo: IOrderRepository,
    customerRepo: ICustomerRepository,
    settingsRepo: ISettingsRepository,
    productRepo: IProductRepository,
    markAsReadyUC: MarkAsReadyUseCase
  ): Promise<Order> {
    const existing = await orderRepo.findById(data.id);
    const settings = await settingsRepo.find();
    if (!existing) {
      throw new NotFoundError([{ path: "order", message: "Order not found" }]);
    }

    if (existing.status === data.status) {
      return existing;
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
    } else if (data.status == "ready") {
      await markAsReadyUC.execute(data.id, orderRepo, driverSocketService);
    }

    return await orderRepo.update(data.id, {
      status: data.status,
      deliveredAt: data.status === "delivered" ? new Date() : undefined,
    });
  }
}
