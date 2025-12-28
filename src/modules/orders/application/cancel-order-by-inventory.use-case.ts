import type { IOrderRepository } from "../domain/orders.iface";
import { NotFoundError, BadRequestError } from "@/shared/presentation";
import filehub from "@/shared/filehub";
import redis from "@/shared/redis";
import { Order } from "../domain/order.entity";

export class CancelOrderByInventoryUseCase {
  async execute(
    orderId: string,
    cancellation: { reason?: string; attachWithFileExtension?: string },
    orderRepo: IOrderRepository
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

    // Directly update order to cancelled status without side effects
    // Since the order is pending, nothing was done yet (no stock reduction, no coupon usage, no points deduction)
    const updatedOrder = await orderRepo.update(orderId, {
      status: "cancelled",
    });

    let cancellationPutUrl: string | undefined;

    if (cancellation.reason) {
      const saveCancellation = await orderRepo.saveCancellation({
        orderId: orderId,
        reason: cancellation.reason,
        cancelledBy: "inventory",
      });
      if (cancellation.attachWithFileExtension) {
        const upload = await filehub.getSignedPutUrl(
          3600 * 24 * 7,
          cancellation.attachWithFileExtension
        );
        cancellationPutUrl = upload.signedUrl;
        await redis.set(
          `filehub:${upload.filename}`,
          saveCancellation.id,
          "EX",
          3600 * 24 * 7
        );
      }
    }

    return { order: updatedOrder, cancellationPutUrl };
  }
}
