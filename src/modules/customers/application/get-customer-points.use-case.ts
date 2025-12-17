import type { ICustomerRepository } from "../domain/customers.iface";
import type { CustomerPointsInfo } from "../domain/customer.entity";
import { NotFoundError } from "../../../shared/presentation/errors";

export class GetCustomerPointsUseCase {
  async execute(
    phone: string,
    repo: ICustomerRepository
  ): Promise<CustomerPointsInfo> {
    const pointsInfo = await repo.getPointsInfo(phone);

    if (!pointsInfo) {
      throw new NotFoundError([
        { path: "phone", message: "Customer not found" },
      ]);
    }

    return pointsInfo;
  }
}
