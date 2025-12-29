import { relations } from "drizzle-orm";
import { orders } from "../orders";
import { staffMembers } from "../staffMembers";
import { users } from "../users";

export const staffMembersRelations = relations(
	staffMembers,
	({ one, many }) => ({
		user: one(users, {
			fields: [staffMembers.userId],
			references: [users.id],
		}),
		orders: many(orders),
	}),
);
