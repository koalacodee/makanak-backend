import {
	boolean,
	index,
	pgTable,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

export const refreshTokens = pgTable(
	"refresh_tokens",
	{
		id: uuid("id").primaryKey(),
		userId: uuid("user_id").notNull(),
		tokenHash: varchar("token_hash", { length: 255 }).notNull(),
		expiresAt: timestamp("expires_at").notNull(),
		revoked: boolean("revoked").notNull().default(false),
		createdAt: timestamp("created_at").defaultNow(),
	},
	(table) => [
		index("refresh_tokens_user_id_idx").on(table.userId),
		index("refresh_tokens_token_hash_idx").on(table.tokenHash),
		index("refresh_tokens_expires_at_idx").on(table.expiresAt),
	],
);
