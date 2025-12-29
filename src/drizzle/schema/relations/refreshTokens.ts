import { relations } from 'drizzle-orm'
import { refreshTokens } from '../refreshTokens'
import { users } from '../users'

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}))
