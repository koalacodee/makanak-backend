import type { IStaffRepository } from "@/modules/staff/domain/staff.iface";
import { BadRequestError, NotFoundError } from "@/shared/presentation";
import type { Order } from "../domain/order.entity";
import type { IOrderRepository } from "../domain/orders.iface";
export class AssignOrderToDriverUseCase {
	async execute(
		orderId: string,
		driverId: string,
		orderRepo: IOrderRepository,
		staffMemberRepo: IStaffRepository,
	): Promise<Order> {
		const order = await orderRepo.findById(orderId);

		if (!order) {
			throw new NotFoundError([{ path: "order", message: "Order not found" }]);
		}

		if (order.driverId) {
			throw new BadRequestError([
				{ path: "order", message: "Order already assigned to a driver" },
			]);
		}

		const staffMember = await staffMemberRepo.findById(driverId);

		if (!staffMember) {
			throw new NotFoundError([
				{ path: "staffMember", message: "Staff member not found" },
			]);
		}

		if (staffMember.role !== "driver") {
			throw new BadRequestError([
				{ path: "staffMember", message: "Staff member is not a driver" },
			]);
		}

		return await orderRepo.update(orderId, {
			driverId: driverId,
		});
	}
}
