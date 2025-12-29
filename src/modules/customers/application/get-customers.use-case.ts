import type { Customer } from '../domain/customer.entity'
import type { ICustomerRepository } from '../domain/customers.iface'
import type { GetCustomersListQuery } from '../presentation/customers.dto'

export class GetCustomersUseCase {
  async execute(
    query: GetCustomersListQuery,
    repo: ICustomerRepository,
  ): Promise<Customer[]> {
    const customers = await repo.findAll({
      search: query.search,
    })
    return customers
  }
}
