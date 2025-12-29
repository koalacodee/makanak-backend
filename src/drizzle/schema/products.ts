import {
  decimal,
  index,
  pgEnum,
  pgTable,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const quantityTypeEnum = pgEnum('quantity_type', ['count', 'weight'])
export const unitOfMeasurementEnum = pgEnum('unit_of_measurement', [
  'ton', // Tonne
  'kg', // Kilogram
  'g', // Gram
  'mg', // Milligram
  'l', // Liter
  'ml', // Milliliter
])
export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    categoryId: uuid('category_id').notNull(),
    description: varchar('description', { length: 1000 }).notNull(),
    stock: decimal('stock', { precision: 10, scale: 2 }).notNull().default('0'),
    originalPrice: decimal('original_price', { precision: 10, scale: 2 }),
    quantityType: quantityTypeEnum('quantity_type').notNull().default('count'),
    unitOfMeasurement: unitOfMeasurementEnum('unit_of_measurement'),
  },
  (table) => [
    index('products_category_idx').on(table.categoryId),
    index('products_stock_idx').on(table.stock),
  ],
)
