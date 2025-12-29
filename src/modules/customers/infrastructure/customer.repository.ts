import { eq, ilike, or, type SQL, sql } from 'drizzle-orm'
import type db from '../../../drizzle'
import { customers } from '../../../drizzle/schema'
import { NotFoundError } from '../../../shared/presentation/errors'
import type {
  Customer,
  CustomerInput,
  CustomerPointsInfo,
  CustomerUpdateInput,
} from '../domain/customer.entity'
import type { ICustomerRepository } from '../domain/customers.iface'
import type { GetCustomersListQuery } from '../presentation/customers.dto'

export class CustomerRepository implements ICustomerRepository {
  constructor(private database: typeof db) {}

  async findByPhone(phone: string): Promise<Customer | null> {
    const result = await this.database
      .select()
      .from(customers)
      .where(eq(customers.phone, phone))
      .limit(1)

    if (result.length === 0) {
      return null
    }

    return this.mapToEntity(result[0])
  }

  async create(data: CustomerInput): Promise<Customer> {
    const [result] = await this.database
      .insert(customers)
      .values({
        phone: data.phone,
        name: data.name || null,
        address: data.address || null,
        points: 0,
        totalSpent: '0',
        totalOrders: 0,
        password: data.password,
      })
      .returning()

    return this.mapToEntity(result)
  }

  async update(phone: string, data: CustomerUpdateInput): Promise<Customer> {
    const existing = await this.findByPhone(phone)
    if (!existing) {
      throw new NotFoundError([
        { path: 'phone', message: 'Customer not found' },
      ])
    }

    const updateData: {
      name?: string | null
      address?: string | null
      points?: number | SQL<unknown>
      totalSpent?: string | SQL<unknown>
      totalOrders?: number | SQL<unknown>
      updatedAt: Date
    } = {
      updatedAt: new Date(),
    }

    if (data.name !== undefined) {
      updateData.name = data.name || null
    }
    if (data.address !== undefined) {
      updateData.address = data.address || null
    }
    if (data.points !== undefined) {
      // Set points to specific value
      updateData.points = data.points
    } else if (data.pointsDelta !== undefined) {
      // Add/subtract from current points
      updateData.points = sql`${customers.points} + ${data.pointsDelta}`
    }

    if (data.totalSpentDelta !== undefined) {
      // Add/subtract from current totalSpent (decimal)
      updateData.totalSpent = sql`COALESCE(${customers.totalSpent}, 0) + ${data.totalSpentDelta}`
    }

    if (data.totalOrdersDelta !== undefined) {
      // Add/subtract from current totalOrders
      updateData.totalOrders = sql`COALESCE(${customers.totalOrders}, 0) + ${data.totalOrdersDelta}`
    }

    const [result] = await this.database
      .update(customers)
      .set(updateData)
      .where(eq(customers.phone, phone))
      .returning()

    return this.mapToEntity(result)
  }

  async changePassword(phone: string, passwordHash: string): Promise<Customer> {
    const [result] = await this.database
      .update(customers)
      .set({ password: passwordHash })
      .where(eq(customers.phone, phone))
      .returning()
    return this.mapToEntity(result)
  }
  async upsert(data: CustomerInput): Promise<Customer> {
    const existing = await this.findByPhone(data.phone)

    if (existing) {
      // Update existing customer
      const updateData: {
        name?: string | null
        address?: string | null
        updatedAt: Date
      } = {
        updatedAt: new Date(),
      }

      if (data.name !== undefined) updateData.name = data.name || null
      if (data.address !== undefined) updateData.address = data.address || null

      const [result] = await this.database
        .update(customers)
        .set(updateData)
        .where(eq(customers.phone, data.phone))
        .returning()

      return this.mapToEntity(result)
    } else {
      // Create new customer
      return await this.create(data)
    }
  }

  async getPointsInfo(phone: string): Promise<CustomerPointsInfo | null> {
    const customer = await this.findByPhone(phone)
    if (!customer) {
      return null
    }

    return {
      phone: customer.phone,
      points: customer.points,
      totalSpent: customer.totalSpent ? parseFloat(customer.totalSpent) : 0,
      totalOrders: customer.totalOrders || 0,
    }
  }

  async findAll(query?: GetCustomersListQuery): Promise<Customer[]> {
    const q = this.database.select().from(customers)

    if (query?.search) {
      q.where(
        or(
          ilike(customers.phone, `%${query.search}%`),
          ilike(customers.name, `%${query.search}%`),
        ),
      )
    }

    const rows = await q

    return rows.map((row) => this.mapToEntity(row))
  }

  private mapToEntity(row: typeof customers.$inferSelect): Customer {
    return {
      phone: row.phone,
      password: row.password,
      name: row.name,
      address: row.address,
      points: row.points,
      totalSpent: row.totalSpent,
      totalOrders: row.totalOrders,
      createdAt: row.createdAt || new Date(),
      updatedAt: row.updatedAt || new Date(),
    }
  }
}
