import { NotFoundError } from "@/shared/presentation";
import { ICustomerRepository } from "../domain/customers.iface";
import { Customer } from "../domain/customer.entity";

export class ChangeCustomerPasswordUseCase {
  async execute(
    data: { phone: string; password: string },
    repo: ICustomerRepository
  ): Promise<Omit<Customer, "password">> {
    const customer = await repo.findByPhone(data.phone);
    if (!customer) {
      throw new NotFoundError([
        { path: "phone", message: "Customer not found" },
      ]);
    }
    const passwordHash = await Bun.password.hash(data.password, "argon2id");
    const updatedCustomer = await repo.changePassword(data.phone, passwordHash);
    return {
      ...updatedCustomer,
    };
  }
}
