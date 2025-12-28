import { relations } from "drizzle-orm";
import { orders } from "../orders";
import { orderCancellation } from "../orderCancellation";

export const orderCancellationRelations = relations(
  orderCancellation,
  ({ one }) => ({
    order: one(orders, {
      fields: [orderCancellation.orderId],
      references: [orders.id],
    }),
  })
);
