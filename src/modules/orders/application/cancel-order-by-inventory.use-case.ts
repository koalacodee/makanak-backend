import type { IOrderRepository } from "../domain/orders.iface";
import { NotFoundError, BadRequestError } from "@/shared/presentation";
import { Order } from "../domain/order.entity";
import { ChangeOrderStatusUseCase } from "./change-order-status.use-case";
import { ICustomerRepository } from "@/modules/customers/domain/customers.iface";
import { IProductRepository } from "@/modules/products/domain/products.iface";
import { ICouponRepository } from "@/modules/coupons/domain/coupon.iface";
import { MarkAsReadyUseCase } from "@/modules/drivers/application/mark-as-ready.use-case";

export class CancelOrderByInventoryUseCase {
  async execute(
    orderId: string,
    cancellation: { reason?: string; attachWithFileExtension?: string },
    orderRepo: IOrderRepository,
    changeOrderStatusUC: ChangeOrderStatusUseCase,
    customerRepo: ICustomerRepository,
    productRepo: IProductRepository,
    couponRepo: ICouponRepository,
    markAsReadyUC: MarkAsReadyUseCase
  ): Promise<{ order: Order; cancellationPutUrl?: string }> {
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

    // Call
    // This will revert all the changes that were made when the order was created
    // and restore the deducted stock, coupon usage, and used customer points
    const { order: updatedOrder, cancellationPutUrl } =
      await changeOrderStatusUC.execute(
        {
          id: orderId,
          status: "cancelled",
          cancellation: {
            reason: cancellation.reason,
            attachWithFileExtension: cancellation.attachWithFileExtension,
          },
        },
        orderRepo,
        customerRepo,
        productRepo,
        couponRepo,
        markAsReadyUC
      );

    return { order: updatedOrder, cancellationPutUrl };
  }
}
