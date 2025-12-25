import type { ICategoryRepository } from "../domain/categories.iface";
import type { Category } from "../domain/category.entity";
import { NotFoundError } from "../../../shared/presentation/errors";
import filehub from "@/shared/filehub";
import redis from "@/shared/redis";

export class UpdateCategoryUseCase {
  async execute(
    id: string,
    data: Partial<Omit<Category, "id">> & { attachWithFileExtension?: string },
    repo: ICategoryRepository
  ): Promise<{
    category: Category;
    uploadUrl?: string;
    newSignedUrl?: string;
  }> {
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

    const category = await repo.update(id, data);
    if (data.attachWithFileExtension) {
      const upload = await filehub.getSignedPutUrl(
        3600 * 24 * 7,
        data.attachWithFileExtension
      );
      const newSignedUrl = await filehub.getSignedUrl(upload.filename);
      await redis.set(
        `filehub:${upload.filename}`,
        category.id,
        "EX",
        3600 * 24 * 7
      );
      return {
        category: category,
        uploadUrl: upload.signedUrl,
        newSignedUrl: newSignedUrl.signedUrl,
      };
    }
    return { category: category };
  }
}
