import type { IOrderRepository } from "../../orders/domain/orders.iface";
import type { IProductRepository } from "../../products/domain/products.iface";
import type { ICouponRepository } from "../../coupons/domain/coupon.iface";
import type { ICustomerRepository } from "../../customers/domain/customers.iface";
import {
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
} from "@/shared/presentation";
import { ChangeOrderStatusUseCase } from "@/modules/orders/application/change-order-status.use-case";
import { MarkAsReadyUseCase } from "./mark-as-ready.use-case";

export class CancelOrderUseCase {
  async execute(
    orderId: string,
    driverId: string,
    cancellationReason: string,
    orderRepo: IOrderRepository,
    productRepo: IProductRepository,
    couponRepo: ICouponRepository,
    customerRepo: ICustomerRepository,
    changeOrderStatusUC: ChangeOrderStatusUseCase,
    markAsReadyUC: MarkAsReadyUseCase
  ): Promise<{ success: boolean }> {
    const order = await orderRepo.findById(orderId);

    if (!order) {
      throw new NotFoundError([
        { path: "orderId", message: "Order not found" },
      ]);
    }

    // Check if driver is assigned to the order
    if (order.driverId !== driverId) {
      throw new UnauthorizedError([
        {
          path: "orderId",
          message: "Order is not assigned to this driver",
        },
      ]);
    }

    // Check if status is out_for_delivery
    if (order.status !== "out_for_delivery") {
      throw new BadRequestError([
        {
          path: "status",
          message: `Order cannot be cancelled. Current status: ${order.status}. Only orders with status "out_for_delivery" can be cancelled by driver.`,
        },
      ]);
    }

    await changeOrderStatusUC.execute(
      { id: orderId, status: "cancelled", cancellationReason },
      orderRepo,
      customerRepo,
      productRepo,
      couponRepo,
      markAsReadyUC
    );

    return { success: true };
  }
}
