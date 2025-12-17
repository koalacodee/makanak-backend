import type { Customer, CustomerInput, CustomerUpdateInput, CustomerPointsInfo } from "./customer.entity";

export interface ICustomerRepository {
  findByPhone(phone: string): Promise<Customer | null>;
  create(data: CustomerInput): Promise<Customer>;
  update(phone: string, data: CustomerUpdateInput): Promise<Customer>;
  upsert(data: CustomerInput): Promise<Customer>;
  getPointsInfo(phone: string): Promise<CustomerPointsInfo | null>;
}

