import type { IAttachmentRepository } from "@/shared/attachments";
import filehub from "@/shared/filehub";
import { NotFoundError } from "../../../shared/presentation/errors";
import type { Product } from "../../products/domain/product.entity";
import type { ICategoryRepository } from "../domain/categories.iface";
import type { Category } from "../domain/category.entity";

export class GetCategoryWithProductsUseCase {
	async execute(
		categoryId: string,
		categoryRepo: ICategoryRepository,
		attachmentRepo: IAttachmentRepository,
	): Promise<
		Category & {
			image: string | undefined;
			products: Array<Product & { image: string | undefined }>;
		}
	> {
		// Get category
		const result = await categoryRepo.findCategoryWithProductsById(categoryId);
		if (!result) {
			throw new NotFoundError([
				{
					path: "category",
					message: "Category not found",
				},
			]);
		}

		const targetIds = [
			result.id,
			...result.products.map((product) => product.id),
		];

		const attachments = await attachmentRepo.findByTargetIds(targetIds);

		const categoryAttachmentFilename = attachments.find(
			(attachment) => attachment.targetId === result.id,
		)?.filename;

		const signedUrls =
			attachments.length > 0
				? await filehub.getSignedUrlBatch(
						attachments.map((attachment) => attachment.filename),
					)
				: [];

		// Map products with their images
		const productsWithImages = result.products.map((product) => {
			const attachment = attachments.find(
				(attachment) => attachment.targetId === product.id,
			);
			const signedUrl = signedUrls.find(
				(signedUrl) => signedUrl.filename === attachment?.filename,
			);
			return {
				...product,
				image: signedUrl?.signedUrl || undefined,
			};
		});

		return {
			...result,
			image:
				signedUrls.find(
					(signedUrl) => signedUrl.filename === categoryAttachmentFilename,
				)?.signedUrl || undefined,
			products: productsWithImages,
		};
	}
}
