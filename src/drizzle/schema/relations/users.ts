import { relations } from 'drizzle-orm'

import { orders } from '../orders'
import { refreshTokens } from '../refreshTokens'
import { users } from '../users'

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  refreshTokens: many(refreshTokens),
}))
