CREATE TABLE "order_cancellation" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_id" uuid,
	"reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "order_cancellation" ADD CONSTRAINT "order_cancellation_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_cancellation_order_id_idx" ON "order_cancellation" USING btree ("order_id");--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "cancellation_reason";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "cancelled_at";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "cancelled_by";