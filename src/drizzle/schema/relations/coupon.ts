import { relations } from 'drizzle-orm'
import { coupons } from '../coupons'
import { orders } from '../orders'

export const couponsRelations = relations(coupons, ({ many }) => ({
  orders: many(orders),
}))
