import type { ICustomerRepository } from "../domain/customers.iface";
import type { Customer, CustomerInput } from "../domain/customer.entity";

export class UpsertCustomerUseCase {
  async execute(
    phone: string,
    data: CustomerInput,
    repo: ICustomerRepository
  ): Promise<Customer> {
    // Ensure phone matches path parameter
    const customerData: CustomerInput = {
      ...data,
      phone,
    };

    return await repo.upsert(customerData);
  }
}
