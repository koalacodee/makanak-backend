import { relations } from 'drizzle-orm'
import { orderItems } from '../orderItems'
import { orders } from '../orders'
import { products } from '../products'

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}))
