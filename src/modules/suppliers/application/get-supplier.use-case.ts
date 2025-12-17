import type { ISupplierRepository } from "../domain/suppliers.iface";
import type { Supplier } from "../domain/supplier.entity";
import { NotFoundError } from "../../../shared/presentation/errors";

export class GetSupplierUseCase {
  async execute(id: string, repo: ISupplierRepository): Promise<Supplier> {
    const supplier = await repo.findById(id);
    if (!supplier) {
      throw new NotFoundError([
        {
          path: "supplier",
          message: "Supplier not found",
        },
      ]);
    }
    return supplier;
  }
}
