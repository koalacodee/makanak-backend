import type { IProductRepository } from "../domain/products.iface";
import type { Product } from "../domain/product.entity";
import {
  NotFoundError,
  ValidationError,
} from "../../../shared/presentation/errors";

export class UpdateProductUseCase {
  async execute(
    id: string,
    data: Partial<Omit<Product, "id">>,
    repo: IProductRepository
  ): Promise<Product> {
    if (Object.keys(data).length === 0) {
      throw new ValidationError(
        "At least one field must be provided for update"
      );
    }

    const existing = await repo.findById(id);
    if (!existing) {
      throw new NotFoundError("Product not found");
    }
    return await repo.update(id, data);
  }
}
