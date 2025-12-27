CREATE TYPE "public"."quantity_type" AS ENUM('count', 'weight');--> statement-breakpoint
CREATE TYPE "public"."unit_of_measurement" AS ENUM('ton', 'kg', 'g', 'mg', 'l', 'ml');--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "quantity_type" "quantity_type" DEFAULT 'count' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "unit_of_measurement" "unit_of_measurement";