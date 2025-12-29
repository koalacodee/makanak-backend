import type { Attachment, AttachmentInput } from './attachment.entity'

export interface IAttachmentRepository {
  findById(id: string): Promise<Attachment | null>
  findByTargetId(targetId: string): Promise<Attachment[]>
  findByTargetIds(targetIds: string[]): Promise<Attachment[]>
  create(data: AttachmentInput): Promise<Attachment>
  update(
    id: string,
    data: Partial<Omit<AttachmentInput, 'targetId'>>,
  ): Promise<Attachment>
  delete(id: string): Promise<void>
  deleteByTargetId(targetId: string): Promise<void>
}
