import { ICustomerRepository } from "@/modules/customers/domain/customers.iface";
import { Order, OrderStatus } from "../domain/order.entity";
import { IOrderRepository } from "../domain/orders.iface";
import { IProductRepository } from "@/modules/products/domain/products.iface";
import { ICouponRepository } from "@/modules/coupons/domain/coupon.iface";
import { NotFoundError } from "@/shared/presentation";
import { MarkAsReadyUseCase } from "@/modules/drivers/application/mark-as-ready.use-case";
import { driverSocketService } from "@/modules/drivers/infrastructure/driver-socket.service";

export class ChangeOrderStatusUseCase {
  async execute(
    data: { id: string; status: OrderStatus; cancellationReason?: string },
    orderRepo: IOrderRepository,
    customerRepo: ICustomerRepository,
    productRepo: IProductRepository,
    couponRepo: ICouponRepository,
    markAsReadyUC: MarkAsReadyUseCase
  ): Promise<Order> {
    const existing = await orderRepo.findById(data.id);
    if (!existing) {
      throw new NotFoundError([{ path: "order", message: "Order not found" }]);
    }

    if (existing.status === data.status) {
      return existing;
    }

    const previousStatus = existing.status;
    const newStatus = data.status;

    // Handle status transitions
    if (newStatus === "ready" && previousStatus !== "ready") {
      // When order becomes ready: reduce stock, reduce coupon usage, reduce points
      await ChangeOrderStatusUseCase.handleReadyStatus(
        existing,
        productRepo,
        couponRepo,
        customerRepo
      );
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
    }

    return await orderRepo.update(data.id, {
      status: data.status,
      deliveredAt: data.status === "delivered" ? new Date() : undefined,
      cancellationReason:
        data.status === "cancelled" ? data.cancellationReason : undefined,
    });
  }

  /**
   * Handle when order status becomes "ready"
   * - Reduce stock
   * - Reduce coupon usage by 1
   * - Reduce points (if points were used)
   */
  static async handleReadyStatus(
    order: Order,
    productRepo: IProductRepository,
    couponRepo: ICouponRepository,
    customerRepo: ICustomerRepository
  ): Promise<void> {
    const promises: Promise<any>[] = [
      // Reduce stock
      productRepo.updateStockMany(
        order.orderItems.map((item) => ({
          id: item.productId,
          delta: -item.quantity,
        }))
      ),
    ];

    // Reduce coupon usage by 1 (if coupon exists)
    if (order.couponId) {
      const coupon = await couponRepo.findById(order.couponId);
      if (coupon && coupon.remainingUses > 0) {
        promises.push(
          couponRepo.update(order.couponId, {
            remainingUses: coupon.remainingUses - 1,
          })
        );
      }
    }

    // Reduce points (if points were used)
    if (order.pointsUsed && order.pointsUsed > 0) {
      promises.push(
        customerRepo.update(order.phone, {
          pointsDelta: -order.pointsUsed,
        })
      );
    }

    await Promise.all(promises);
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
      previousStatus === "delivered";
    const wasDelivered = previousStatus === "delivered";

    const promises: Promise<any>[] = [];

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
