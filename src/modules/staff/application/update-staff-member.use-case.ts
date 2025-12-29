import type { IUserRepository } from '@/modules/auth/domain/auth.iface'
import { NotFoundError } from '../../../shared/presentation/errors'
import type { StaffMember } from '../domain/staff.entity'
import type { IStaffRepository } from '../domain/staff.iface'

export class UpdateStaffMemberUseCase {
  async execute(
    id: string,
    data: {
      name?: string
      username?: string
      password?: string
      role?: 'admin' | 'driver' | 'cs' | 'inventory'
      phone?: string
      specialization?: string
    },
    staffRepo: IStaffRepository,
    userRepo: IUserRepository,
  ): Promise<StaffMember> {
    // Check if staff member exists
    const existing = await staffRepo.findById(id)
    if (!existing) {
      throw new NotFoundError([
        {
          path: 'staff',
          message: 'Staff member not found',
        },
      ])
    }

    // Update user if username, password, or role changed
    if (data.username || data.password || data.role) {
      const updateUserData: {
        username?: string
        role?: 'admin' | 'driver' | 'cs' | 'inventory'
        passwordHash?: string
      } = {}
      if (data.username !== undefined) updateUserData.username = data.username
      if (data.role !== undefined) updateUserData.role = data.role
      if (data.password !== undefined) {
        updateUserData.passwordHash = await Bun.password.hash(
          data.password,
          'argon2id',
        )
      }

      if (Object.keys(updateUserData).length > 0) {
        await userRepo.update(existing.userId, updateUserData)
      }
    }

    // Update staff member
    const updateStaffData: {
      name?: string
      phone?: string
      specialization?: string
    } = {}
    if (data.name !== undefined) updateStaffData.name = data.name
    if (data.phone !== undefined) updateStaffData.phone = data.phone
    if (data.specialization !== undefined)
      updateStaffData.specialization = data.specialization

    return await staffRepo.update(id, updateStaffData)
  }
}
