import type { IProductRepository } from "../domain/products.iface";
import type { Product } from "../domain/product.entity";
import { NotFoundError } from "../../../shared/presentation/errors";

export class GetProductUseCase {
  async execute(id: string, repo: IProductRepository): Promise<Product> {
    const product = await repo.findById(id);
    if (!product) {
      throw new NotFoundError("Product not found");
    }
    return product;
  }
}
