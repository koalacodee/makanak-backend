import type { IProductRepository } from "../domain/products.iface";
import type { Product } from "../domain/product.entity";
import { ValidationError } from "../../../shared/presentation/errors";

export class CreateProductUseCase {
  async execute(
    data: Omit<Product, "id">,
    repo: IProductRepository
  ): Promise<Product> {
    // Validate required fields
    if (!data.name || !data.name.trim()) {
      throw new ValidationError("Product name is required");
    }
    if (!data.price || parseFloat(data.price) <= 0) {
      throw new ValidationError("Product price must be greater than 0");
    }
    if (!data.unit || !data.unit.trim()) {
      throw new ValidationError("Product unit is required");
    }
    if (!data.category || !data.category.trim()) {
      throw new ValidationError("Product category is required");
    }
    if (!data.image || !data.image.trim()) {
      throw new ValidationError("Product image is required");
    }
    if (data.stock < 0) {
      throw new ValidationError("Product stock cannot be negative");
    }

    return await repo.create(data);
  }
}
