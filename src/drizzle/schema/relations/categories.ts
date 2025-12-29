import { relations } from 'drizzle-orm'
import { categories } from '../categories'
import { products } from '../products'

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}))
