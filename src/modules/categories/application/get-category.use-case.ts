import { NotFoundError } from '../../../shared/presentation/errors'
import type { ICategoryRepository } from '../domain/categories.iface'
import type { Category } from '../domain/category.entity'

export class GetCategoryUseCase {
  async execute(id: string, repo: ICategoryRepository): Promise<Category> {
    const category = await repo.findById(id)
    if (!category) {
      throw new NotFoundError([
        {
          path: 'category',
          message: 'Category not found',
        },
      ])
    }
    return category
  }
}
