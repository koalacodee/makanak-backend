CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"filename" varchar(255) NOT NULL,
	"target_id" uuid NOT NULL,
	"size" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "attachments_target_id_idx" ON "attachments" USING btree ("target_id");