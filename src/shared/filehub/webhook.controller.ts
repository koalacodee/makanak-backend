import Elysia, { t } from "elysia";
import { WebhookDataBasicDTO, WebhookDataFullDTO } from "./webhook.dto";
import redis from "@/shared/redis";
import db from "@/drizzle";
import { attachments } from "@/drizzle/schema";

export const fileHubWebHookController = new Elysia({
  prefix: "/filehub/webhook",
}).post(
  "/uploaded",
  async ({ body }) => {
    try {
      if (body.event === "upload_completed") {
        const targetId = await redis.get(`filehub:${body.objectPath}`);
        if (!targetId) {
          console.warn(`Target not found for objectPath: ${body.objectPath}`);
          return { success: false, message: "Target not found" };
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
        const targetId = await redis.get(`filehub:${body.upload?.uploadKey}`);
        if (!targetId) {
          console.warn(
            `Target not found for uploadKey: ${body.upload?.uploadKey}`
          );
          return { success: false, message: "Target not found" };
        }
        await db.insert(attachments).values({
          id: Bun.randomUUIDv7(),
          filename: body.upload?.filePath ?? "",
          size: body.upload?.uploadLength ?? 0,
          targetId: targetId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        console.warn(`Unknown event type: ${(body as any).event}`);
        return { success: false, message: "Unknown event type" };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error("Webhook processing error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
  {
    body: t.Any(), // Use t.Any() to avoid strict validation issues
    beforeHandle: async ({ body }) => {
      // Manual validation
      if (!body || typeof body !== "object") {
        throw new Error("Invalid webhook body");
      }

      const webhookBody = body as any;

      // Validate basic structure
      if (webhookBody.event === "upload_completed") {
        if (!webhookBody.objectPath || typeof webhookBody.size !== "number") {
          throw new Error("Invalid upload_completed webhook data");
        }
      } else if (webhookBody.event === "tus_completed") {
        if (!webhookBody.upload || !webhookBody.upload.uploadKey) {
          throw new Error("Invalid tus_completed webhook data");
        }
      } else {
        throw new Error(`Unknown event type: ${webhookBody.event}`);
      }
    },
  }
);
