import type { GetCustomersListQuery } from '../presentation/customers.dto'
import type {
  Customer,
  CustomerInput,
  CustomerPointsInfo,
  CustomerUpdateInput,
} from './customer.entity'

export interface ICustomerRepository {
  findByPhone(phone: string): Promise<Customer | null>
  create(data: CustomerInput): Promise<Customer>
  update(phone: string, data: CustomerUpdateInput): Promise<Customer>
  changePassword(phone: string, passwordHash: string): Promise<Customer>
  upsert(data: CustomerInput): Promise<Customer>
  getPointsInfo(phone: string): Promise<CustomerPointsInfo | null>
  findAll(query?: GetCustomersListQuery): Promise<Customer[]>
}
