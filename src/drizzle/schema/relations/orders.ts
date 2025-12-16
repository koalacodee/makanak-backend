import { relations } from "drizzle-orm";
import { orders } from "../orders";
import { customers } from "../customers";
import { staffMembers } from "../staffMembers";
import { orderItems } from "../orderItems";

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.phone],
    references: [customers.phone],
  }),
  driver: one(staffMembers, {
    fields: [orders.driverId],
    references: [staffMembers.id],
  }),
  items: many(orderItems),
}));
