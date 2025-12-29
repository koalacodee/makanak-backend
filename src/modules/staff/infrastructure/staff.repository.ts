import { eq } from 'drizzle-orm'
import type db from '../../../drizzle'
import { staffMembers, users } from '../../../drizzle/schema'
import type { StaffMember, StaffRole } from '../domain/staff.entity'
import type { IStaffRepository } from '../domain/staff.iface'

export class StaffRepository implements IStaffRepository {
  constructor(private database: typeof db) {}

  async findAll(role?: StaffRole): Promise<StaffMember[]> {
    const baseQuery = this.database
      .select({
        staffMember: staffMembers,
        user: users,
      })
      .from(staffMembers)
      .innerJoin(users, eq(staffMembers.userId, users.id))

    const result = role
      ? await baseQuery.where(eq(users.role, role))
      : await baseQuery

    return result.map((row) => this.mapToEntity(row.staffMember, row.user))
  }

  async findById(id: string): Promise<StaffMember | null> {
    const result = await this.database
      .select({
        staffMember: staffMembers,
        user: users,
      })
      .from(staffMembers)
      .innerJoin(users, eq(staffMembers.userId, users.id))
      .where(eq(staffMembers.id, id))
      .limit(1)

    if (result.length === 0) {
      return null
    }

    return this.mapToEntity(result[0].staffMember, result[0].user)
  }

  async findByUserId(userId: string): Promise<StaffMember | null> {
    const result = await this.database
      .select({
        staffMember: staffMembers,
        user: users,
      })
      .from(staffMembers)
      .innerJoin(users, eq(staffMembers.userId, users.id))
      .where(eq(staffMembers.userId, userId))
      .limit(1)

    if (result.length === 0) {
      return null
    }

    return this.mapToEntity(result[0].staffMember, result[0].user)
  }

  async create(data: {
    userId: string
    name: string
    phone?: string
    activeOrders?: number
    specialization?: string
    isOnline?: boolean
  }): Promise<StaffMember> {
    const id = Bun.randomUUIDv7()

    const [result] = await this.database
      .insert(staffMembers)
      .values({
        id,
        userId: data.userId,
        name: data.name,
        phone: data.phone || null,
        activeOrders: data.activeOrders || 0,
        specialization: data.specialization || null,
        isOnline: data.isOnline || false,
      })
      .returning()

    // Fetch the user to get username and role
    const userResult = await this.database
      .select()
      .from(users)
      .where(eq(users.id, data.userId))
      .limit(1)

    if (userResult.length === 0) {
      throw new Error('User not found')
    }

    return this.mapToEntity(result, userResult[0])
  }

  async update(
    id: string,
    data: {
      name?: string
      phone?: string
      activeOrders?: number
      specialization?: string
      isOnline?: boolean
    },
  ): Promise<StaffMember> {
    const updateData: {
      name?: string
      phone?: string
      activeOrders?: number
      specialization?: string
      isOnline?: boolean
      updatedAt?: Date
    } = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.activeOrders !== undefined)
      updateData.activeOrders = data.activeOrders
    if (data.specialization !== undefined)
      updateData.specialization = data.specialization
    if (data.isOnline !== undefined) updateData.isOnline = data.isOnline
    updateData.updatedAt = new Date()

    const [result] = await this.database
      .update(staffMembers)
      .set(updateData)
      .where(eq(staffMembers.id, id))
      .returning()

    // Fetch the user to get username and role
    const userResult = await this.database
      .select()
      .from(users)
      .where(eq(users.id, result.userId))
      .limit(1)

    if (userResult.length === 0) {
      throw new Error('User not found')
    }

    return this.mapToEntity(result, userResult[0])
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(staffMembers).where(eq(staffMembers.id, id))
  }

  private mapToEntity(
    staffRow: typeof staffMembers.$inferSelect,
    userRow: typeof users.$inferSelect,
  ): StaffMember {
    return {
      id: staffRow.id,
      userId: staffRow.userId,
      name: staffRow.name,
      username: userRow.username,
      role: userRow.role,
      phone: staffRow.phone || null,
      activeOrders: staffRow.activeOrders || null,
      specialization: staffRow.specialization || null,
      isOnline: staffRow.isOnline || null,
      createdAt: staffRow.createdAt || new Date(),
      updatedAt: staffRow.updatedAt || new Date(),
    }
  }
}
