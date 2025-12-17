import type { ISupplierRepository } from "../domain/suppliers.iface";
import { NotFoundError } from "../../../shared/presentation/errors";

export class DeleteSupplierUseCase {
  async execute(id: string, repo: ISupplierRepository): Promise<void> {
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

    await repo.delete(id);
  }
}
