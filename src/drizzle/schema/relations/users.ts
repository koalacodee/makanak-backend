import { relations } from "drizzle-orm";

import { orders } from "../orders";
import { users } from "../users";
import { refreshTokens } from "../refreshTokens";

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  refreshTokens: many(refreshTokens),
}));
