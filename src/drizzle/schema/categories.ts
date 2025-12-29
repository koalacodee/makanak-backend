import { boolean, index, pgTable, uuid, varchar } from 'drizzle-orm/pg-core'

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    icon: varchar('icon', { length: 100 }).notNull(),
    color: varchar('color', { length: 100 }).notNull(),
    isHidden: boolean('is_hidden').notNull().default(false),
    isLocked: boolean('is_locked').notNull().default(false),
  },
  (table) => [index('categories_is_hidden_idx').on(table.isHidden)],
)
