import type { ChangeOrderStatusUseCase } from "@/modules/orders/application/change-order-status.use-case";
import type { Order } from "@/modules/orders/domain/order.entity";
import {
	BadRequestError,
	NotFoundError,
	UnauthorizedError,
} from "@/shared/presentation";
import redis from "@/shared/redis";
import type { ICouponRepository } from "../../coupons/domain/coupon.iface";
import type { ICustomerRepository } from "../../customers/domain/customers.iface";
import type { IOrderRepository } from "../../orders/domain/orders.iface";
import type { IProductRepository } from "../../products/domain/products.iface";
import type { MarkAsReadyUseCase } from "./mark-as-ready.use-case";

export class CancelOrderUseCase {
	async execute(
		orderId: string,
		driverId: string,
		cancellation: { reason?: string; attachWithFileExtension?: string },
		orderRepo: IOrderRepository,
		productRepo: IProductRepository,
		couponRepo: ICouponRepository,
		customerRepo: ICustomerRepository,
		changeOrderStatusUC: ChangeOrderStatusUseCase,
		markAsReadyUC: MarkAsReadyUseCase,
	): Promise<{ order: Order; cancellationPutUrl?: string }> {
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

		const { order: savedOrder, cancellationPutUrl } =
			await changeOrderStatusUC.execute(
				{ id: orderId, status: "cancelled", cancellation },
				orderRepo,
				customerRepo,
				productRepo,
				couponRepo,
				markAsReadyUC,
			);

		// Remove driver from busy_drivers and add back to available_drivers
		await redis.srem("busy_drivers", driverId);
		await redis.rpush("available_drivers", driverId);

		return { order: savedOrder, cancellationPutUrl };
	}
}
