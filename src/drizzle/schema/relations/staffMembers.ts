import { relations } from "drizzle-orm";
import { users } from "../users";
import { staffMembers } from "../staffMembers";
import { orders } from "../orders";

export const staffMembersRelations = relations(
  staffMembers,
  ({ one, many }) => ({
    user: one(users, {
      fields: [staffMembers.userId],
      references: [users.id],
    }),
    orders: many(orders),
  })
);
