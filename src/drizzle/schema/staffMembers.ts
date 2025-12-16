import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const staffMembers = pgTable(
  "staff_members",
  {
    id: uuid("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    username: varchar("username", { length: 100 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    role: varchar("role", { length: 50 })
      .notNull()
      .$type<"admin" | "driver" | "cs" | "inventory">(),
    phone: varchar("phone", { length: 20 }),
    activeOrders: integer("active_orders").default(0),
    specialization: varchar("specialization", { length: 255 }),
    isOnline: boolean("is_online").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("staff_members_role_idx").on(table.role),
    index("staff_members_is_online_idx").on(table.isOnline),
    index("staff_members_username_idx").on(table.username),
  ]
);
