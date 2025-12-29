import { relations } from 'drizzle-orm'
import { orderCancellation } from '../orderCancellation'
import { orders } from '../orders'

export const orderCancellationRelations = relations(
  orderCancellation,
  ({ one }) => ({
    order: one(orders, {
      fields: [orderCancellation.orderId],
      references: [orders.id],
    }),
  }),
)
