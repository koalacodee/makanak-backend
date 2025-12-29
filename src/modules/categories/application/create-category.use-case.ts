import filehub from '@/shared/filehub'
import redis from '@/shared/redis'
import type { ICategoryRepository } from '../domain/categories.iface'
import type { Category } from '../domain/category.entity'
export class CreateCategoryUseCase {
  async execute(
    data: Omit<Category, 'id'> | Category,
    repo: ICategoryRepository,
    attachWithFileExtension?: string,
  ): Promise<{
    category: Category
    uploadUrl?: string
    newSignedUrl?: string
  }> {
    const cat = await repo.create(data)

    if (attachWithFileExtension) {
      const upload = await filehub.getSignedPutUrl(
        3600 * 24 * 7,
        attachWithFileExtension,
      )
      const newSignedUrl = await filehub.getSignedUrl(upload.filename)
      await redis.hset(`filehub:${upload.filename}`, {
        id: cat.id,
        shouldConvertToAvif: '1',
      })
      return {
        category: cat,
        uploadUrl: upload.signedUrl,
        newSignedUrl: newSignedUrl.signedUrl,
      }
    }
    return { category: cat }
  }
}
