ALTER TABLE "staff_members" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "staff_members" CASCADE;--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_staff_member_id_unique";--> statement-breakpoint
DROP INDEX "users_staff_member_id_idx";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "staff_member_id";