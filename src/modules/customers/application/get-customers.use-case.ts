import type { ICustomerRepository } from "../domain/customers.iface";
import type { Customer } from "../domain/customer.entity";

export class GetCustomersUseCase {
  async execute(repo: ICustomerRepository): Promise<Customer[]> {
    const customers = await repo.findAll();
    return customers;
  }
}
