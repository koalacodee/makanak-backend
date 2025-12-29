import { decimal, jsonb, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'

export const storeSettings = pgTable('store_settings', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => Bun.randomUUIDv7()),
  pointsSystem: jsonb('points_system').$type<{
    active: boolean
    value: number
    redemptionValue: number
  }>(),
  deliveryFee: decimal('delivery_fee', { precision: 10, scale: 2 }),
  announcement: jsonb('announcement').$type<{
    active: boolean
    message: string
  }>(),
  socialMedia: jsonb('social_media').$type<{
    facebook?: string
    instagram?: string
    phone?: string
    email?: string
  }>(),
  paymentInfo: jsonb('payment_info').$type<{
    vodafoneCash?: string
    instaPay?: string
  }>(),
  promo: jsonb('promo').$type<{
    isActive: boolean
    imageFilename?: string
    topBadge?: string
    title?: string
    description?: string
    code?: string
    buttonText?: string
  }>(),
  content: jsonb('content').$type<{
    hero?: {
      badge?: string
      titleLine1?: string
      titleHighlight?: string
      description?: string
    }
    features?: Array<{
      title?: string
      description?: string
    }>
    journey?: {
      title?: string
      steps?: Array<{
        title?: string
        description?: string
      }>
    }
    sections?: {
      categoriesTitle?: string
      categoriesSubtitle?: string
    }
    info?: {
      terms?: Array<{
        title?: string
        description?: string
      }>
      quality?: {
        title?: string
        description?: string
        hotline?: string
      }
    }
  }>(),
  driverCancellationReasons: jsonb('driver_cancellation_reasons').$type<
    string[]
  >(),
  inventoryCancellationReasons: jsonb('inventory_cancellation_reasons').$type<
    string[]
  >(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
