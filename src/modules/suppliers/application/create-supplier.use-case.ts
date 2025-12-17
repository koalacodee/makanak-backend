import type { ISupplierRepository } from "../domain/suppliers.iface";
import type { Supplier, SupplierInput } from "../domain/supplier.entity";
import { BadRequestError } from "../../../shared/presentation/errors";

export class CreateSupplierUseCase {
  async execute(
    data: SupplierInput,
    repo: ISupplierRepository
  ): Promise<Supplier> {
    // Validate required fields
    if (!data.name || !data.name.trim()) {
      throw new BadRequestError([
        {
          path: "name",
          message: "Supplier name is required",
        },
      ]);
    }

    if (!data.phone || !data.phone.trim()) {
      throw new BadRequestError([
        {
          path: "phone",
          message: "Phone number is required",
        },
      ]);
    }

    if (!data.category || !data.category.trim()) {
      throw new BadRequestError([
        {
          path: "category",
          message: "Category is required",
        },
      ]);
    }

    return await repo.create(data);
  }
}
