import { t } from "elysia";

// WebhookDataFull DTO
export const WebhookDataFullDTO = t.Object({
	event: t.Literal("tus_completed"),
	upload: t.Object({
		uploadId: t.String(),
		uploadExpiry: t.String({ format: "date-time" }), // ISO 8601
		filePath: t.Optional(t.String()),
		originalFilename: t.Optional(t.String()),
		uploadLength: t.Optional(t.Number()),
		uploadKey: t.String(),
	}),
	metadata: t.Optional(
		t.Object({
			expiration: t.Optional(t.String({ format: "date-time" })),
			isGlobal: t.Optional(t.Union([t.Literal("0"), t.Literal("1")])),
			originalFilename: t.Optional(t.String()),
			uploadKey: t.Optional(t.String()),
		}),
	),
	timestamp: t.String({ format: "date-time" }), // ISO 8601
});

// WebhookDataBasic DTO
export const WebhookDataBasicDTO = t.Object({
	event: t.Literal("upload_completed"),
	timestamp: t.String({ format: "date-time" }), // ISO 8601
	objectPath: t.String(),
	size: t.Number(),
});
