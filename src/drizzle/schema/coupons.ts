import {
  decimal,
  index,
  integer,
  pgTable,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const coupons = pgTable(
  'coupons',
  {
    id: uuid('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    value: decimal('value', { precision: 10, scale: 2 }).notNull(),
    remainingUses: integer('remaining_uses').notNull().default(0),
  },
  (table) => [index('coupons_name_idx').on(table.name)],
)
