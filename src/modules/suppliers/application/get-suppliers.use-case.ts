import type { ISupplierRepository } from "../domain/suppliers.iface";
import type { Supplier, SupplierStatus } from "../domain/supplier.entity";

export class GetSuppliersUseCase {
  async execute(
    filters:
      | {
          status?: SupplierStatus;
          category?: string;
        }
      | undefined,
    repo: ISupplierRepository
  ): Promise<Supplier[]> {
    return await repo.findAll(filters);
  }
}
