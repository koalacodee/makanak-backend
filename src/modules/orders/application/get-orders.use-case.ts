import type { IAttachmentRepository } from "@/shared/attachments/domain/attachments.iface";
import filehub from "@/shared/filehub";
import { ValidationError } from "../../../shared/presentation/errors";
import type { Order, OrderStatus } from "../domain/order.entity";
import type { IOrderRepository } from "../domain/orders.iface";

export class GetOrdersUseCase {
	async execute(
		filters: {
			status?: OrderStatus;
			driverId?: string;
			page?: number;
			limit?: number;
			search?: string;
		},
		repo: IOrderRepository,
		attachmentRepo: IAttachmentRepository,
	): Promise<{
		data: Order[];
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
			status: filters.status,
			driverId: filters.driverId,
			page,
			limit,
			search: filters.search,
		});

		const targetIds = result.data.map((order) => order.id);

		result.data.forEach((order) => {
			if (order.cancellation) {
				targetIds.push(order.cancellation.id);
			}
		});

		const attachments = await attachmentRepo.findByTargetIds(targetIds);

		const signedUrls =
			attachments.length > 0
				? await filehub.getSignedUrlBatch(
						attachments.map((attachment) => attachment.filename),
						1000 * 60 * 60 * 24 * 6, // 6 days
					)
				: [];

		const totalPages = Math.ceil(result.total / limit);

		return {
			data: result.data.map((order) => {
				const attachment = attachments.find(
					(attachment) => attachment.targetId === order.id,
				);
				const signedUrl = signedUrls.find(
					(signedUrl) => signedUrl.filename === attachment?.filename,
				);
				if (order.cancellation) {
					const cancellationAttachment = attachments.find(
						(attachment) => attachment.targetId === order.cancellation?.id,
					);
					const cancellationSignedUrl = signedUrls.find(
						(signedUrl) =>
							signedUrl.filename === cancellationAttachment?.filename,
					);
					order.cancellation = {
						...order.cancellation,
						image: cancellationSignedUrl?.signedUrl,
					};
				}
				return {
					...order,
					receiptImage: signedUrl?.signedUrl,
				};
			}),
			pagination: {
				page,
				limit,
				total: result.total,
				totalPages,
			},
		};
	}
}
