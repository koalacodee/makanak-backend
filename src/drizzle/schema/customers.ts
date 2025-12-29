import {
	decimal,
	integer,
	pgTable,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

export const customers = pgTable("customers", {
	phone: varchar("phone", { length: 20 }).primaryKey(),
	name: varchar("name", { length: 255 }),
	address: varchar("address", { length: 500 }),
	points: integer("points").notNull().default(0),
	password: varchar("password", { length: 255 }).notNull(),
	totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0"),
	totalOrders: integer("total_orders").default(0),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});
