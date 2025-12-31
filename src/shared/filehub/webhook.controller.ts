import { eq } from 'drizzle-orm'
import Elysia, { t } from 'elysia'
import db from '@/drizzle'
import { attachments } from '@/drizzle/schema'
import redis from '@/shared/redis'
import filehub from '.'
import { WebhookDataBasicDTO, WebhookDataFullDTO } from './webhook.dto'
export const fileHubWebHookController = new Elysia({
  prefix: '/filehub/webhook',
}).post(
  '/uploaded',
  async ({ body }) => {
    if (body.event === 'upload_completed') {
      const target = await redis.hgetall(`filehub:${body.objectPath}`)
      if (!target) {
        console.error(`Target not found: ${body.objectPath}`)
        // return new Response("Target not found", { status: 404 });
        return
      }
      let data = body
      if (target.shouldConvertToAvif === '1') {
        const avif = await filehub.convertToAvif({
          objectPath: body.objectPath,
          deleteOriginal: true,
        })
        data = {
          ...data,
          objectPath: avif.avifObjectPath,
          size: avif.size,
        }
      }
      await upsertAttachment(target.id, data.objectPath, data.size)
    } else if (body.event === 'tus_completed') {
      const target = await redis.hgetall(`filehub:${body.upload.uploadKey}`)
      if (!target) {
        // return new Response("Target not found", { status: 404 });
        console.error(`Target not found: ${body.upload.uploadKey}`)
        return
      }
      let data = body.upload
      if (target.shouldConvertToAvif === '1') {
        const avif = await filehub.convertToAvif({
          objectPath: body.upload.filePath ?? '',
          deleteOriginal: true,
        })
        data = {
          ...data,
          filePath: avif.avifObjectPath,
          uploadLength: avif.size,
        }
      }
      await upsertAttachment(
        target.id,
        data.filePath ?? '',
        data.uploadLength ?? 0,
      )
    }
    return {
      success: true,
    }
  },
  {
    body: t.Union([WebhookDataBasicDTO, WebhookDataFullDTO]),
  },
)

async function upsertAttachment(
  targetId: string,
  filename: string,
  size: number,
) {
  const target = await db
    .select()
    .from(attachments)
    .where(eq(attachments.targetId, targetId))
  if (target.length > 0) {
    await db
      .update(attachments)
      .set({
        filename: filename,
        size: size,
        updatedAt: new Date(),
      })
      .where(eq(attachments.id, target[0].id))
  } else {
    await db.insert(attachments).values({
      id: Bun.randomUUIDv7(),
      filename: filename,
      size: size,
      targetId: targetId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }
}
