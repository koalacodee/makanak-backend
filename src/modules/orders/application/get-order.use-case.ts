import type { IOrderRepository } from "../domain/orders.iface";
import type { Order } from "../domain/order.entity";
import { NotFoundError } from "../../../shared/presentation/errors";
import { IAttachmentRepository } from "@/shared/attachments";
import filehub from "@/shared/filehub";

export class GetOrderUseCase {
  async execute(
    id: string,
    repo: IOrderRepository,
    attachmentRepo: IAttachmentRepository
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

    const attachment = await attachmentRepo.findByTargetId(order.id);
    const signedUrl =
      attachment.length > 0
        ? await filehub.getSignedUrl(attachment[0].filename)
        : undefined;
    return { ...order, receiptImage: signedUrl?.signedUrl };
  }
}
