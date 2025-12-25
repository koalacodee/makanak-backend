import Elysia, { t } from "elysia";
import { WebhookDataBasicDTO, WebhookDataFullDTO } from "./webhook.dto";
import redis from "@/shared/redis";
import db from "@/drizzle";
import { attachments } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
export const fileHubWebHookController = new Elysia({
  prefix: "/filehub/webhook",
}).post(
  "/uploaded",
  async ({ body }) => {
    if (body.event === "upload_completed") {
      const targetId = await redis.get(`filehub:${body.objectPath}`);
      if (!targetId) {
        // return new Response("Target not found", { status: 404 });
        return;
      }
      await upsertAttachment(targetId, body.objectPath, body.size);
    } else if (body.event === "tus_completed") {
      const targetId = await redis.get(`filehub:${body.upload.uploadKey}`);
      if (!targetId) {
        // return new Response("Target not found", { status: 404 });
        return;
      }
      await upsertAttachment(
        targetId,
        body.upload.filePath ?? "",
        body.upload.uploadLength ?? 0
      );
    }
    return {
      success: true,
    };
  },
  {
    body: t.Union([WebhookDataBasicDTO, WebhookDataFullDTO]),
  }
);

async function upsertAttachment(
  targetId: string,
  filename: string,
  size: number
) {
  const target = await db
    .select()
    .from(attachments)
    .where(eq(attachments.targetId, targetId));
  if (target.length > 0) {
    await db
      .update(attachments)
      .set({
        filename: filename,
        size: size,
        updatedAt: new Date(),
      })
      .where(eq(attachments.id, target[0].id));
  } else {
    await db.insert(attachments).values({
      id: Bun.randomUUIDv7(),
      filename: filename,
      size: size,
      targetId: targetId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
