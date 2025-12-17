import type { ICategoryRepository } from "../domain/categories.iface";
import type { Category } from "../domain/category.entity";
import { NotFoundError } from "../../../shared/presentation/errors";

export class UpdateCategoryUseCase {
  async execute(
    id: string,
    data: Partial<Omit<Category, "id">>,
    repo: ICategoryRepository
  ): Promise<Category> {
    // Check if category exists
    const existing = await repo.findById(id);
    if (!existing) {
      throw new NotFoundError([
        {
          path: "category",
          message: "Category not found",
        },
      ]);
    }

    return await repo.update(id, data);
  }
}
