import type { IAttachmentRepository } from "@/shared/attachments";
import filehub from "@/shared/filehub";
import { ValidationError } from "../../../shared/presentation/errors";
import type { Product } from "../domain/product.entity";
import type { IProductRepository } from "../domain/products.iface";

export class GetProductsUseCase {
	async execute(
		filters: {
			category?: string;
			inStock?: boolean;
			page?: number;
			limit?: number;
			search?: string;
		},
		repo: IProductRepository,
		attachmentRepo: IAttachmentRepository,
	): Promise<{
		data: (Product & { image: string | undefined })[];
		pagination: {
			page: number;
			limit: number;
			total: number;
			totalPages: number;
		};
	}> {
		const page = filters.page ?? 1;
		const limit = filters.limit ?? 20;

		// Validate pagination parameters
		if (page < 1) {
			throw new ValidationError([
				{
					path: "page",
					message: "Page must be greater than 0",
				},
			]);
		}
		if (limit < 1 || limit > 100) {
			throw new ValidationError([
				{
					path: "limit",
					message: "Limit must be between 1 and 100",
				},
			]);
		}

		const result = await repo.findAll({
			categoryId: filters.category,
			inStock: filters.inStock,
			page,
			limit,
			search: filters.search,
		});

		const attachments = await attachmentRepo.findByTargetIds(
			result.data.map((product) => product.id),
		);

		const signedUrls =
			attachments.length > 0
				? await filehub.getSignedUrlBatch(
						attachments.map((attachment) => attachment.filename),
					)
				: [];

		const data = result.data.map((product) => {
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
		const totalPages = Math.ceil(result.total / limit);

		return {
			data,
			pagination: {
				page,
				limit,
				total: result.total,
				totalPages,
			},
		};
	}
}
