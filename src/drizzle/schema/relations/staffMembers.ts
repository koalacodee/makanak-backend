import { relations } from "drizzle-orm";
import { staffMembers } from "../staffMembers";
import { orders } from "../orders";

export const staffMembersRelations = relations(staffMembers, ({ many }) => ({
  orders: many(orders),
}));
