import type { ICategoryRepository } from "../domain/categories.iface";
import type { Category } from "../domain/category.entity";

export class GetCategoriesUseCase {
  async execute(
    includeHidden: boolean,
    repo: ICategoryRepository
  ): Promise<Category[]> {
    return await repo.findAll(includeHidden);
  }
}
