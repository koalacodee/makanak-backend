import { relations } from "drizzle-orm";
import { customers } from "../customers";
import { orders } from "../orders";

export const customersRelations = relations(customers, ({ many }) => ({
	orders: many(orders),
}));
