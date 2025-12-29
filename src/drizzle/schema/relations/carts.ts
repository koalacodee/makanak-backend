import { relations } from 'drizzle-orm'
import { cartItems } from '../cartItems'
import { carts } from '../carts'
import { customers } from '../customers'
import { products } from '../products'

export const cartsRelations = relations(carts, ({ one, many }) => ({
  customer: one(customers, {
    fields: [carts.customerPhone],
    references: [customers.phone],
  }),
  items: many(cartItems),
}))

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}))
