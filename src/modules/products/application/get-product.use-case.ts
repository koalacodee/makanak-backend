import type { IProductRepository } from "../domain/products.iface";
import type { Product } from "../domain/product.entity";
import { NotFoundError } from "../../../shared/presentation/errors";
import { IAttachmentRepository } from "@/shared/attachments";
import filehub from "@/shared/filehub";

export class GetProductUseCase {
  async execute(
    id: string,
    repo: IProductRepository,
    attachmentRepo: IAttachmentRepository
  ): Promise<Product & { image: string | undefined }> {
    const product = await repo.findById(id);
    const attachment = await attachmentRepo.findByTargetId(id);
    const signedUrl =
      attachment.length > 0
        ? await filehub
            .getSignedUrl(attachment[0].filename)
            .then((url) => url.signedUrl)
        : undefined;
    if (!product) {
      throw new NotFoundError([{ path: "id", message: "Product not found" }]);
    }
    return {
      ...product,
      image: signedUrl,
    };
  }
}
