import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),

    username: varchar("username", { length: 100 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: varchar("role", { length: 50 })
      .notNull()
      .$type<"admin" | "driver" | "cs" | "inventory">(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    lastLoginAt: timestamp("last_login_at"),
  },
  (table) => [
    index("users_username_idx").on(table.username),
    index("users_role_idx").on(table.role),
  ]
);
