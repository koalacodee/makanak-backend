import {
  pgTable,
  uuid,
  varchar,
  decimal,
  integer,
  index,
} from "drizzle-orm/pg-core";

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    unit: varchar("unit", { length: 50 }).notNull(),
    categoryId: uuid("category_id").notNull(),
    image: varchar("image", { length: 500 }).notNull(),
    description: varchar("description", { length: 1000 }).notNull(),
    stock: integer("stock").notNull().default(0),
    originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  },
  (table) => [
    index("products_category_idx").on(table.categoryId),
    index("products_stock_idx").on(table.stock),
  ]
);
