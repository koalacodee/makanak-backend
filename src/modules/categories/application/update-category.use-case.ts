import filehub from '@/shared/filehub'
import redis from '@/shared/redis'
import { NotFoundError } from '../../../shared/presentation/errors'
import type { ICategoryRepository } from '../domain/categories.iface'
import type { Category } from '../domain/category.entity'

export class UpdateCategoryUseCase {
  async execute(
    id: string,
    data: Partial<Omit<Category, 'id'>> & { attachWithFileExtension?: string },
    repo: ICategoryRepository,
  ): Promise<{
    category: Category
    uploadUrl?: string
    newSignedUrl?: string
  }> {
    // Check if category exists
    const existing = await repo.findById(id)
    if (!existing) {
      throw new NotFoundError([
        {
          path: 'category',
          message: 'Category not found',
        },
      ])
    }

    const category = await repo.update(id, data)
    if (data.attachWithFileExtension) {
      const upload = await filehub.getSignedPutUrl(
        3600 * 24 * 7,
        data.attachWithFileExtension,
      )
      const filename = upload.filename.split('.')[0]
      const newSignedUrl = await filehub.getSignedUrl(`${filename}.avif`)
      await redis.hset(`filehub:${upload.filename}`, {
        id: category.id,
        shouldConvertToAvif: '1',
      })
      return {
        category: category,
        uploadUrl: upload.signedUrl,
        newSignedUrl: newSignedUrl.signedUrl,
      }
    }
    return { category: category }
  }
}
