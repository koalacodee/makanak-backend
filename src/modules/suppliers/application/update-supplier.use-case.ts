import type { ISupplierRepository } from "../domain/suppliers.iface";
import type { Supplier, SupplierInput } from "../domain/supplier.entity";
import { NotFoundError } from "../../../shared/presentation/errors";

export class UpdateSupplierUseCase {
  async execute(
    id: string,
    data: Partial<SupplierInput>,
    repo: ISupplierRepository
  ): Promise<Supplier> {
    // Check if supplier exists
    const existing = await repo.findById(id);
    if (!existing) {
      throw new NotFoundError([
        {
          path: "supplier",
          message: "Supplier not found",
        },
      ]);
    }

    return await repo.update(id, data);
  }
}
