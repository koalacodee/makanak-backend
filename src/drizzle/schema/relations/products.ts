import { relations } from 'drizzle-orm'
import { categories } from '../categories'
import { orderItems } from '../orderItems'
import { products } from '../products'

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
}))
