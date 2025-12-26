CREATE TYPE "public"."cancelled_by" AS ENUM('driver', 'inventory');--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cancellation_reason" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cancelled_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cancelled_by" "cancelled_by";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "verification_hash" varchar(255);