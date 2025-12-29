import {
  boolean,
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const staffMembers = pgTable(
  'staff_members',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id').notNull().unique(), // Reference to users table
    name: varchar('name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    activeOrders: integer('active_orders').default(0),
    specialization: varchar('specialization', { length: 255 }),
    isOnline: boolean('is_online').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('staff_members_user_id_idx').on(table.userId),
    index('staff_members_is_online_idx').on(table.isOnline),
  ],
)
