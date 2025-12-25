import type { IProductRepository } from "../domain/products.iface";
import { NotFoundError } from "../../../shared/presentation/errors";

export class DeleteProductUseCase {
  async execute(id: string, repo: IProductRepository): Promise<void> {
    const existing = await repo.findById(id);
    if (!existing) {
      throw new NotFoundError([
        { path: "product", message: "Product not found" },
      ]);
    }
    await repo.delete(id);
  }
}
