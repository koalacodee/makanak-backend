import { eq, inArray } from "drizzle-orm";
import type db from "../../../drizzle";
import { attachments } from "../../../drizzle/schema";
import type { Attachment, AttachmentInput } from "../domain/attachment.entity";
import type { IAttachmentRepository } from "../domain/attachments.iface";

export class AttachmentRepository implements IAttachmentRepository {
	constructor(private database: typeof db) {}

	async findById(id: string): Promise<Attachment | null> {
		const result = await this.database
			.select()
			.from(attachments)
			.where(eq(attachments.id, id))
			.limit(1);

		if (result.length === 0) {
			return null;
		}

		return this.mapToEntity(result[0]);
	}

	async findByTargetId(targetId: string): Promise<Attachment[]> {
		const result = await this.database
			.select()
			.from(attachments)
			.where(eq(attachments.targetId, targetId));

		return result.map(this.mapToEntity);
	}

	async findByTargetIds(targetIds: string[]): Promise<Attachment[]> {
		const result = await this.database
			.select()
			.from(attachments)
			.where(inArray(attachments.targetId, targetIds));

		return result.map(this.mapToEntity);
	}

	async create(data: AttachmentInput): Promise<Attachment> {
		const id = Bun.randomUUIDv7();

		const [result] = await this.database
			.insert(attachments)
			.values({
				id,
				filename: data.filename,
				targetId: data.targetId,
				size: data.size,
			})
			.returning();

		return this.mapToEntity(result);
	}

	async update(
		id: string,
		data: Partial<Omit<AttachmentInput, "targetId">>,
	): Promise<Attachment> {
		const updateData: { filename?: string; size?: number } = {};
		if (data.filename !== undefined) updateData.filename = data.filename;
		if (data.size !== undefined) updateData.size = data.size;

		const [result] = await this.database
			.update(attachments)
			.set(updateData)
			.where(eq(attachments.id, id))
			.returning();

		return this.mapToEntity(result);
	}

	async delete(id: string): Promise<void> {
		await this.database.delete(attachments).where(eq(attachments.id, id));
	}

	async deleteByTargetId(targetId: string): Promise<void> {
		await this.database
			.delete(attachments)
			.where(eq(attachments.targetId, targetId));
	}

	private mapToEntity(row: typeof attachments.$inferSelect): Attachment {
		return {
			id: row.id,
			filename: row.filename,
			targetId: row.targetId,
			size: row.size,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
		};
	}
}
