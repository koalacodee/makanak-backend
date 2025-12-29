import { sql } from 'drizzle-orm'
import {
  decimal,
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey(),
    customerName: varchar('customer_name', { length: 255 }).notNull(),
    referenceCode: varchar('reference_code', { length: 255 }),
    phone: varchar('phone', { length: 20 }).notNull(),
    address: varchar('address', { length: 500 }).notNull(),
    subtotal: decimal('subtotal', { precision: 10, scale: 2 }),
    deliveryFee: decimal('delivery_fee', { precision: 10, scale: 2 }),
    total: decimal('total', { precision: 10, scale: 2 }).notNull(),
    status: varchar('status', { length: 50 })
      .notNull()
      .default('pending')
      .$type<
        | 'pending'
        | 'processing'
        | 'ready'
        | 'out_for_delivery'
        | 'delivered'
        | 'cancelled'
      >(),
    driverId: uuid('driver_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    deliveredAt: timestamp('delivered_at'),
    paymentMethod: varchar('payment_method', { length: 20 }).$type<
      'cod' | 'online'
    >(),
    pointsUsed: integer('points_used').default(0),
    pointsEarned: integer('points_earned').default(0),
    couponDiscount: decimal('coupon_discount', {
      precision: 10,
      scale: 2,
    })
      .default('0')
      .$type<number>(),
    couponId: uuid('coupon_id'),
    pointsDiscount: decimal('points_discount', {
      precision: 10,
      scale: 2,
    }).default('0'),
    verificationHash: varchar('verification_hash', { length: 255 }),
    // Legacy fields for backward compatibility
    date: timestamp('date').defaultNow(),
    timestamp: integer('timestamp').$default(
      () => sql`EXTRACT(EPOCH FROM NOW())::integer`,
    ),
    deliveryTimestamp: integer('delivery_timestamp'),
  },
  (table) => [
    index('orders_status_idx').on(table.status),
    index('orders_driver_id_idx').on(table.driverId),
    index('orders_phone_idx').on(table.phone),
    index('orders_created_at_idx').on(table.createdAt),
    index('orders_coupon_id_idx').on(table.couponId),
  ],
)
