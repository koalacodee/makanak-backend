import {
	NotFoundError,
	UnauthorizedError,
} from "../../../shared/presentation/errors";
import type { Customer } from "../domain/customer.entity";
import type { ICustomerRepository } from "../domain/customers.iface";

export class GetCustomerUseCase {
	async execute(
		data: { phone: string; password: string },
		repo: ICustomerRepository,
	): Promise<Customer> {
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

		return customer;
	}
}
