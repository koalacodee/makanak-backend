import type { ICouponRepository } from "@/modules/coupons/domain/coupon.iface";
import type { ICustomerRepository } from "@/modules/customers/domain/customers.iface";
import type { MarkAsReadyUseCase } from "@/modules/drivers/application/mark-as-ready.use-case";
import type { IProductRepository } from "@/modules/products/domain/products.iface";
import filehub from "@/shared/filehub";
import { NotFoundError } from "@/shared/presentation";
import redis from "@/shared/redis";
import type { Order, OrderStatus } from "../domain/order.entity";
import type { IOrderRepository } from "../domain/orders.iface";
import type { Coupon } from "@/modules/coupons/domain/coupon.entity";
import type { Customer } from "@/modules/customers/domain/customer.entity";

export class ChangeOrderStatusUseCase {
  async execute(
    data: {
      id: string;
      status: OrderStatus;
      cancellation: { reason?: string; attachWithFileExtension?: string };
    },
    orderRepo: IOrderRepository,
    customerRepo: ICustomerRepository,
    productRepo: IProductRepository,
    couponRepo: ICouponRepository,
    markAsReadyUC: MarkAsReadyUseCase
  ): Promise<{ order: Order; cancellationPutUrl?: string }> {
    const existing = await orderRepo.findById(data.id);
    if (!existing) {
      throw new NotFoundError([{ path: "order", message: "Order not found" }]);
    }

    if (existing.status === data.status) {
      return { order: existing };
    }

    const previousStatus = existing.status;
    const newStatus = data.status;
    let cancellationPutUrl: string | undefined;

    // Handle status transitions
    if (newStatus === "ready" && previousStatus !== "ready") {
      // When order becomes ready: mark as ready assigning a driver
      await markAsReadyUC.execute(data.id, orderRepo);
    } else if (newStatus === "delivered" && previousStatus !== "delivered") {
      // When order becomes delivered: add points earned, update totalSpent, update totalOrders
      await this.handleDeliveredStatus(existing, customerRepo);
    } else if (newStatus === "cancelled" && previousStatus !== "cancelled") {
      // When order is cancelled: restore everything based on what was already done
      await this.handleCancelledStatus({
        order: existing,
        previousStatus,
        couponRepo,
        productRepo,
        customerRepo,
      });

      if (data.cancellation.reason) {
        const saveCancellation = await orderRepo.saveCancellation({
          orderId: data.id,
          reason: data.cancellation.reason,
          cancelledBy: "inventory",
        });
        if (data.cancellation.attachWithFileExtension) {
          const upload = await filehub.getSignedPutUrl(
            3600 * 24 * 7,
            data.cancellation.attachWithFileExtension
          );

          await redis.set(
            `filehub:${upload.filename}`,
            saveCancellation.id,
            "EX",
            3600 * 24 * 7
          );
          cancellationPutUrl = upload.signedUrl;
        }
      }
    }

    const updated = await orderRepo.update(data.id, {
      status: data.status,
      deliveredAt: data.status === "delivered" ? new Date() : undefined,
    });
    return { order: updated, cancellationPutUrl };
  }

  /**
   * Handle when order status becomes "delivered"
   * - Add points earned
   * - Update totalSpent
   * - Update totalOrders
   */
  private async handleDeliveredStatus(
    order: Order,
    customerRepo: ICustomerRepository
  ): Promise<void> {
    const totalAmount = order.total;

    await customerRepo.update(order.phone, {
      pointsDelta: order.pointsEarned ?? 0,
      totalSpentDelta: totalAmount,
      totalOrdersDelta: 1,
    });
  }

  /**
   * Handle when order status becomes "cancelled"
   * Restore everything based on what was already done:
   * - If order was "ready" or beyond: restore stock, restore coupon usage, restore points
   * - If order was "delivered": also revert totalSpent and totalOrders
   */
  private async handleCancelledStatus({
    order,
    previousStatus,
    couponRepo,
    productRepo,
    customerRepo,
  }: {
    order: Order;
    previousStatus: OrderStatus;
    couponRepo: ICouponRepository;
    productRepo: IProductRepository;
    customerRepo: ICustomerRepository;
  }): Promise<void> {
    const wasReadyOrBeyond =
      previousStatus === "ready" ||
      previousStatus === "out_for_delivery" ||
      previousStatus === "pending" ||
      previousStatus === "processing";
    const wasDelivered = previousStatus === "delivered";

    const promises: Array<Promise<void> | Promise<Coupon> | Promise<Customer>> =
      [];

    if (wasReadyOrBeyond) {
      // Restore stock
      promises.push(
        productRepo.updateStockMany(
          order.orderItems.map((item) => ({
            id: item.productId,
            delta: item.quantity, // Add back the stock
          }))
        )
      );

      // Restore coupon usage (if coupon exists)
      if (order.couponId) {
        const coupon = await couponRepo.findById(order.couponId);
        if (coupon) {
          promises.push(
            couponRepo.update(order.couponId, {
              remainingUses: coupon.remainingUses + 1,
            })
          );
        }
      }

      // Restore points (if points were used)
      if (order.pointsUsed && order.pointsUsed > 0) {
        promises.push(
          customerRepo.update(order.phone, {
            pointsDelta: order.pointsUsed,
          })
        );
      }
    }

    if (wasDelivered) {
      // Revert customer stats (points earned, totalSpent, totalOrders)
      const totalAmount = order.total;
      promises.push(
        customerRepo.update(order.phone, {
          pointsDelta: -(order.pointsEarned ?? 0),
          totalSpentDelta: -totalAmount,
          totalOrdersDelta: -1,
        })
      );
    }

    await Promise.all(promises);
  }
}
