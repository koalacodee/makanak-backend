import { eq } from 'drizzle-orm'
import type db from '../../../drizzle'
import { coupons } from '../../../drizzle/schema'
import type { Coupon, CouponInput } from '../domain/coupon.entity'
import type { ICouponRepository } from '../domain/coupon.iface'

export class CouponRepository implements ICouponRepository {
  constructor(private database: typeof db) {}

  async findAll(): Promise<Coupon[]> {
    const result = await this.database.select().from(coupons)
    return result.map(this.mapToEntity)
  }

  async findById(id: string): Promise<Coupon | null> {
    const result = await this.database
      .select()
      .from(coupons)
      .where(eq(coupons.id, id))
      .limit(1)

    if (result.length === 0) {
      return null
    }

    return this.mapToEntity(result[0])
  }

  async findByName(name: string): Promise<Coupon | null> {
    const result = await this.database
      .select()
      .from(coupons)
      .where(eq(coupons.name, name))
      .limit(1)

    if (result.length === 0) {
      return null
    }

    return this.mapToEntity(result[0])
  }

  async create(data: CouponInput): Promise<Coupon> {
    const id = Bun.randomUUIDv7()

    const [result] = await this.database
      .insert(coupons)
      .values({
        id,
        name: data.name,
        value: data.value.toString(),
        remainingUses: data.remainingUses,
      })
      .returning()

    return this.mapToEntity(result)
  }

  async update(id: string, data: Partial<CouponInput>): Promise<Coupon> {
    const updateData: {
      name?: string
      value?: string
      remainingUses?: number
    } = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.value !== undefined) updateData.value = data.value.toString()
    if (data.remainingUses !== undefined)
      updateData.remainingUses = data.remainingUses

    const [result] = await this.database
      .update(coupons)
      .set(updateData)
      .where(eq(coupons.id, id))
      .returning()

    return this.mapToEntity(result)
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(coupons).where(eq(coupons.id, id))
  }

  private mapToEntity(row: typeof coupons.$inferSelect): Coupon {
    return {
      id: row.id,
      name: row.name,
      value: parseFloat(row.value),
      remainingUses: row.remainingUses,
    }
  }
}
