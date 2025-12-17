import type { ICategoryRepository } from "../domain/categories.iface";
import type { Category } from "../domain/category.entity";

export class CreateCategoryUseCase {
  async execute(
    data: Omit<Category, "id"> | Category,
    repo: ICategoryRepository
  ): Promise<Category> {
    return await repo.create(data);
  }
}
