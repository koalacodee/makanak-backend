import type { ICategoryRepository } from "../domain/categories.iface";
import type { Category } from "../domain/category.entity";
import filehub from "@/shared/filehub";
import redis from "@/shared/redis";
export class CreateCategoryUseCase {
  async execute(
    data: Omit<Category, "id"> | Category,
    repo: ICategoryRepository,
    attachWithFileExtension?: string
  ): Promise<{
    category: Category;
    uploadUrl?: string;
    newSignedUrl?: string;
  }> {
    const cat = await repo.create(data);

    if (attachWithFileExtension) {
      const upload = await filehub.getSignedPutUrl(
        3600 * 24 * 7,
        attachWithFileExtension
      );
      const newSignedUrl = await filehub.getSignedUrl(upload.filename);
      await redis.set(
        `filehub:${upload.filename}`,
        cat.id,
        "EX",
        3600 * 24 * 7
      );
      return {
        category: cat,
        uploadUrl: upload.signedUrl,
        newSignedUrl: newSignedUrl.signedUrl,
      };
    }
    return { category: cat };
  }
}
