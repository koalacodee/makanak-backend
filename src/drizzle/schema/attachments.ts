import {
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const attachments = pgTable(
  'attachments',
  {
    id: uuid('id').primaryKey(),
    filename: varchar('filename', { length: 255 }).notNull(),
    targetId: uuid('target_id').notNull(),
    size: integer('size').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('attachments_target_id_idx').on(table.targetId)],
)
