CREATE TABLE "coupons" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"remaining_uses" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "coupons_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE INDEX "coupons_name_idx" ON "coupons" USING btree ("name");