import type { IAttachmentRepository } from "@/shared/attachments";
import filehub from "@/shared/filehub";
import { NotFoundError } from "../../../shared/presentation/errors";
import type { Order } from "../domain/order.entity";
import type { IOrderRepository } from "../domain/orders.iface";

export class GetOrderUseCase {
	async execute(
		id: string,
		repo: IOrderRepository,
		attachmentRepo: IAttachmentRepository,
	): Promise<Order & { receiptImage?: string }> {
		const order = await repo.findById(id);
		if (!order) {
			throw new NotFoundError([
				{
					path: "order",
					message: "Order not found",
				},
			]);
		}

		const attachments = await attachmentRepo.findByTargetIds(
			[order.id, order.cancellation?.id ?? undefined].filter(
				(id) => id !== undefined,
			),
		);
		const signedUrls =
			attachments.length > 0
				? await filehub.getSignedUrlBatch(
						attachments.map((attachment) => attachment.filename),
						1000 * 60 * 60 * 24 * 6, // 6 days
					)
				: undefined;

		const orderAttachment = attachments.find(
			(attachment) => attachment.targetId === order.id,
		);
		const receiptImage = signedUrls?.find(
			(signedUrl) => signedUrl.filename === orderAttachment?.filename,
		)?.signedUrl;

		if (order.cancellation) {
			const cancellationAttachment = attachments.find(
				(attachment) => attachment.targetId === order.cancellation?.id,
			);
			const cancellationSignedUrl = signedUrls?.find(
				(signedUrl) => signedUrl.filename === cancellationAttachment?.filename,
			)?.signedUrl;
			order.cancellation = {
				...order.cancellation,
				image: cancellationSignedUrl,
			};
		}
		return {
			...order,
			receiptImage,
		};
	}
}
