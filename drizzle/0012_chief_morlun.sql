ALTER TABLE "orders" ADD COLUMN "coupon_id" uuid;--> statement-breakpoint
CREATE INDEX "orders_coupon_id_idx" ON "orders" USING btree ("coupon_id");