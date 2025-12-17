CREATE TABLE "products" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"unit" varchar(50) NOT NULL,
	"category_id" uuid NOT NULL,
	"image" varchar(500) NOT NULL,
	"description" varchar(1000) NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"original_price" numeric(10, 2)
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"icon" varchar(100) NOT NULL,
	"color" varchar(100) NOT NULL,
	"image" varchar(500) NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"phone" varchar(20) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"address" varchar(500),
	"points" integer DEFAULT 0 NOT NULL,
	"total_spent" numeric(10, 2) DEFAULT '0',
	"total_orders" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"address" varchar(500) NOT NULL,
	"subtotal" numeric(10, 2),
	"delivery_fee" numeric(10, 2),
	"total" numeric(10, 2) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"driver_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"delivered_at" timestamp,
	"receipt_image" varchar(1000),
	"payment_method" varchar(20),
	"points_used" integer DEFAULT 0,
	"points_discount" numeric(10, 2) DEFAULT '0',
	"date" timestamp DEFAULT now(),
	"timestamp" integer,
	"delivery_timestamp" integer
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_members" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"username" varchar(100) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"phone" varchar(20),
	"active_orders" integer DEFAULT 0,
	"specialization" varchar(255),
	"is_online" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "staff_members_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"category" varchar(255) NOT NULL,
	"company_name" varchar(255),
	"notes" varchar(1000),
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "store_settings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"points_system" jsonb,
	"delivery_fee" numeric(10, 2),
	"announcement" jsonb,
	"social_media" jsonb,
	"payment_info" jsonb,
	"promo" jsonb,
	"content" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"staff_member_id" uuid NOT NULL,
	"username" varchar(100) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_login_at" timestamp,
	CONSTRAINT "users_staff_member_id_unique" UNIQUE("staff_member_id"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"revoked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "products_stock_idx" ON "products" USING btree ("stock");--> statement-breakpoint
CREATE INDEX "categories_is_hidden_idx" ON "categories" USING btree ("is_hidden");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_driver_id_idx" ON "orders" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "orders_phone_idx" ON "orders" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_product_id_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "staff_members_role_idx" ON "staff_members" USING btree ("role");--> statement-breakpoint
CREATE INDEX "staff_members_is_online_idx" ON "staff_members" USING btree ("is_online");--> statement-breakpoint
CREATE INDEX "staff_members_username_idx" ON "staff_members" USING btree ("username");--> statement-breakpoint
CREATE INDEX "suppliers_status_idx" ON "suppliers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "suppliers_category_idx" ON "suppliers" USING btree ("category");--> statement-breakpoint
CREATE INDEX "users_staff_member_id_idx" ON "users" USING btree ("staff_member_id");--> statement-breakpoint
CREATE INDEX "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens" USING btree ("expires_at");