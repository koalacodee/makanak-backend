ALTER TABLE "order_cancellation" ALTER COLUMN "reason" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "order_cancellation" ADD CONSTRAINT "order_cancellation_order_id_unique" UNIQUE("order_id");