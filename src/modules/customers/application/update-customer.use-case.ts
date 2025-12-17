import type { ICustomerRepository } from "../domain/customers.iface";
import type { Customer, CustomerUpdateInput } from "../domain/customer.entity";
import { BadRequestError } from "../../../shared/presentation/errors";

export class UpdateCustomerUseCase {
  async execute(
    phone: string,
    data: CustomerUpdateInput,
    repo: ICustomerRepository
  ): Promise<Customer> {
    // Validate that either points or pointsDelta is provided, not both
    if (data.points !== undefined && data.pointsDelta !== undefined) {
      throw new BadRequestError([
        {
          path: "points",
          message: "Cannot specify both 'points' and 'pointsDelta'",
        },
      ]);
    }

    return await repo.update(phone, data);
  }
}
