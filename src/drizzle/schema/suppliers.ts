import { index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const suppliers = pgTable(
	"suppliers",
	{
		id: uuid("id").primaryKey(),
		name: varchar("name", { length: 255 }).notNull(),
		phone: varchar("phone", { length: 20 }).notNull(),
		category: varchar("category", { length: 255 }).notNull(),
		companyName: varchar("company_name", { length: 255 }),
		notes: varchar("notes", { length: 1000 }),
		status: varchar("status", { length: 50 })
			.notNull()
			.default("pending")
			.$type<"active" | "pending">(),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(table) => [
		index("suppliers_status_idx").on(table.status),
		index("suppliers_category_idx").on(table.category),
	],
);
