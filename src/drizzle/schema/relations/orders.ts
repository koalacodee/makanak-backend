import { relations } from "drizzle-orm";
import { orders } from "../orders";
import { customers } from "../customers";
import { users } from "../users";
import { staffMembers } from "../staffMembers";
import { orderItems } from "../orderItems";
import { coupons } from "../coupons";
import { orderCancellation } from "../orderCancellation";

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.phone],
    references: [customers.phone],
  }),
  driver: one(users, {
    fields: [orders.driverId],
    references: [users.id],
  }),
  driverStaff: one(staffMembers, {
    fields: [orders.driverId],
    references: [staffMembers.userId],
  }),
  items: many(orderItems),
  coupon: one(coupons, {
    fields: [orders.couponId],
    references: [coupons.id],
  }),
  cancellation: one(orderCancellation, {
    fields: [orders.id],
    references: [orderCancellation.orderId],
  }),
}));
