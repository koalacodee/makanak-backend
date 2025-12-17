import Elysia, { t } from "elysia";
import { WebhookDataBasicDTO, WebhookDataFullDTO } from "./webhook.dto";
import redis from "@/shared/redis";
import db from "@/drizzle";
import { attachments } from "@/drizzle/schema";
export const fileHubWebHookController = new Elysia({
  prefix: "/filehub/webhook",
}).post(
  "/",
  async ({ body }) => {
    if (body.event === "upload_completed") {
      const targetId = await redis.get(`filehub:${body.objectPath}`);
      if (!targetId) {
        // return new Response("Target not found", { status: 404 });
        return;
      }
      await db.insert(attachments).values({
        id: Bun.randomUUIDv7(),
        filename: body.objectPath,
        size: body.size,
        targetId: targetId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else if (body.event === "tus_completed") {
      const targetId = await redis.get(`filehub:${body.upload.uploadKey}`);
      if (!targetId) {
        // return new Response("Target not found", { status: 404 });
        return;
      }
      await db.insert(attachments).values({
        id: Bun.randomUUIDv7(),
        filename: body.upload.filePath ?? "",
        size: body.upload.uploadLength ?? 0,
        targetId: targetId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    return {
      success: true,
    };
  },
  {
    body: t.Union([WebhookDataBasicDTO, WebhookDataFullDTO]),
  }
);
