import type { IAttachmentRepository } from "@/shared/attachments";
import filehub from "@/shared/filehub";
import type { ICategoryRepository } from "../domain/categories.iface";
import type { Category } from "../domain/category.entity";

export class GetCategoriesUseCase {
	async execute(
		includeHidden: boolean,
		categoryRepo: ICategoryRepository,
		attachmentRepo: IAttachmentRepository,
	): Promise<Array<Category & { image: string | undefined }>> {
		const categories = await categoryRepo.findAll(includeHidden);

		// Fetch all attachments for all categories in parallel
		const targetIds = categories.map((category) => category.id);
		const attachments = await attachmentRepo.findByTargetIds(targetIds);

		const signedUrls =
			attachments.length > 0
				? await filehub.getSignedUrlBatch(
						attachments.map((attachment) => attachment.filename),
					)
				: [];

		return categories.map((category) => {
			const attachment = attachments.find(
				(attachment) => attachment.targetId === category.id,
			);
			const signedUrl = signedUrls.find(
				(signedUrl) => signedUrl.filename === attachment?.filename,
			);
			return {
				...category,
				image: signedUrl?.signedUrl || undefined,
			};
		});
	}
}
