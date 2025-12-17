import type { ICustomerRepository } from "../domain/customers.iface";
import type { Customer } from "../domain/customer.entity";
import { NotFoundError } from "../../../shared/presentation/errors";

export class GetCustomerUseCase {
  async execute(phone: string, repo: ICustomerRepository): Promise<Customer> {
    const customer = await repo.findByPhone(phone);

    if (!customer) {
      throw new NotFoundError([
        { path: "phone", message: "Customer not found" },
      ]);
    }

    return customer;
  }
}
