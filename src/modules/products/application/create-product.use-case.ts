import type { IProductRepository } from "../domain/products.iface";
import type { Product } from "../domain/product.entity";
import { ValidationError } from "../../../shared/presentation/errors";
import filehub from "@/shared/filehub";
import redis from "@/shared/redis";

export class CreateProductUseCase {
  async execute(
    data: Omit<Product, "id">,
    repo: IProductRepository,
    attachWithFileExtension?: string
  ): Promise<{ product: Product; uploadUrl?: string; newSignedUrl?: string }> {
    // Validate required fields
    if (!data.name || !data.name.trim()) {
      throw new ValidationError([
        { path: "name", message: "Product name is required" },
      ]);
    }
    if (!data.price || data.price <= 0) {
      throw new ValidationError([
        { path: "price", message: "Product price must be greater than 0" },
      ]);
    }
    if (!data.unit || !data.unit.trim()) {
      throw new ValidationError([
        { path: "unit", message: "Product unit is required" },
      ]);
    }
    if (!data.category || !data.category.trim()) {
      throw new ValidationError([
        { path: "category", message: "Product category is required" },
      ]);
    }
    if (data.stock < 0) {
      throw new ValidationError([
        { path: "stock", message: "Product stock cannot be negative" },
      ]);
    }

    const product = await repo.create(data);

    if (attachWithFileExtension) {
      const upload = await filehub.getSignedPutUrl(
        3600 * 24 * 7,
        attachWithFileExtension
      );
      const newSignedUrl = await filehub.getSignedUrl(upload.filename);
      await redis.set(
        `filehub:${upload.filename}`,
        product.id,
        "EX",
        3600 * 24 * 7
      );
      return {
        product,
        uploadUrl: upload.signedUrl,
        newSignedUrl: newSignedUrl.signedUrl,
      };
    }
    return { product };
  }
}
