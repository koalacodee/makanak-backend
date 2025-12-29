import {
	NotFoundError,
	UnauthorizedError,
} from "../../../shared/presentation/errors";
import type { CustomerPointsInfo } from "../domain/customer.entity";
import type { ICustomerRepository } from "../domain/customers.iface";

export class GetCustomerPointsUseCase {
	async execute(
		data: { phone: string; password: string },
		repo: ICustomerRepository,
	): Promise<CustomerPointsInfo> {
		const customer = await repo.findByPhone(data.phone);

		if (!customer) {
			throw new NotFoundError([
				{ path: "phone", message: "Customer not found" },
			]);
		}

		const isPasswordValid = await Bun.password.verify(
			data.password,
			customer.password!,
			"argon2id",
		);
		if (!isPasswordValid) {
			throw new UnauthorizedError([
				{ path: "password", message: "Invalid password" },
			]);
		}

		return {
			points: customer.points,
			totalSpent: customer.totalSpent ? parseFloat(customer.totalSpent) : 0,
			totalOrders: customer.totalOrders || 0,
			phone: customer.phone,
		};
	}
}
