import { relations } from "drizzle-orm";
import { orders } from "../orders";
import { customers } from "../customers";
import { users } from "../users";
import { orderItems } from "../orderItems";

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.phone],
    references: [customers.phone],
  }),
  driver: one(users, {
    fields: [orders.driverId],
    references: [users.id],
  }),
  items: many(orderItems),
}));
