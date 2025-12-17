import type { IProductRepository } from "../domain/products.iface";
import type { Product } from "../domain/product.entity";
import { ValidationError } from "../../../shared/presentation/errors";

export class GetProductsUseCase {
  async execute(
    filters: {
      category?: string;
      inStock?: boolean;
      page?: number;
      limit?: number;
    },
    repo: IProductRepository
  ): Promise<{
    data: Product[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    // Validate pagination parameters
    if (page < 1) {
      throw new ValidationError([
        {
          path: "page",
          message: "Page must be greater than 0",
        },
      ]);
    }
    if (limit < 1 || limit > 100) {
      throw new ValidationError([
        {
          path: "limit",
          message: "Limit must be between 1 and 100",
        },
      ]);
    }

    const result = await repo.findAll({
      categoryId: filters.category,
      inStock: filters.inStock,
      page,
      limit,
    });

    const totalPages = Math.ceil(result.total / limit);

    return {
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
      },
    };
  }
}
