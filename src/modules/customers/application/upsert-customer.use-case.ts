import { UnauthorizedError } from "@/shared/presentation";
import type { Customer, CustomerInput } from "../domain/customer.entity";
import type { ICustomerRepository } from "../domain/customers.iface";

export class UpsertCustomerUseCase {
	async execute(
		data: CustomerInput,
		repo: ICustomerRepository,
	): Promise<Omit<Customer, "password">> {
		const existingCustomer = await repo.findByPhone(data.phone);
		if (existingCustomer) {
			const isPasswordValid = await Bun.password.verify(
				data.password,
				existingCustomer.password,
				"argon2id",
			);
			if (!isPasswordValid) {
				throw new UnauthorizedError([
					{ path: "password", message: "Invalid password" },
				]);
			}
			const updatedCustomer = await repo.update(data.phone, data);
			return {
				...updatedCustomer,
			};
		} else {
			const passwordHash = await Bun.password.hash(data.password, "argon2id");
			const newCustomer = await repo.create({
				...data,
				password: passwordHash,
			});
			return {
				...newCustomer,
			};
		}
	}
}
