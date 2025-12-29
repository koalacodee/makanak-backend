import { index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { customers } from "./customers";

export const carts = pgTable(
	"carts",
	{
		id: uuid("id").primaryKey(),
		customerPhone: varchar("customer_phone", { length: 20 })
			.notNull()
			.references(() => customers.phone, { onDelete: "cascade" }),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(table) => [index("carts_customer_phone_idx").on(table.customerPhone)],
);
