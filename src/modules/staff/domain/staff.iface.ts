import type { StaffMember, StaffRole } from './staff.entity'

export interface IStaffRepository {
  findAll(role?: StaffRole): Promise<StaffMember[]>
  findById(id: string): Promise<StaffMember | null>
  findByUserId(userId: string): Promise<StaffMember | null>
  create(data: {
    userId: string
    name: string
    phone?: string
    activeOrders?: number
    specialization?: string
    isOnline?: boolean
  }): Promise<StaffMember>
  update(
    id: string,
    data: {
      name?: string
      phone?: string
      activeOrders?: number
      specialization?: string
      isOnline?: boolean
    },
  ): Promise<StaffMember>
  delete(id: string): Promise<void>
}
