import { Elysia } from 'elysia'
import db from '../../../drizzle'
import { AttachmentRepository } from './attachment.repository'

export const attachmentsModule = new Elysia({
  name: 'attachmentsModule',
}).decorate('attachmentRepo', new AttachmentRepository(db))
