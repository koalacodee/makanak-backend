ALTER TABLE "customers" ADD COLUMN "password" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "receipt_image";