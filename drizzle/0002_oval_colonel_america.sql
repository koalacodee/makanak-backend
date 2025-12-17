CREATE TABLE "staff_members" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(20),
	"active_orders" integer DEFAULT 0,
	"specialization" varchar(255),
	"is_online" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "staff_members_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE INDEX "staff_members_user_id_idx" ON "staff_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "staff_members_is_online_idx" ON "staff_members" USING btree ("is_online");