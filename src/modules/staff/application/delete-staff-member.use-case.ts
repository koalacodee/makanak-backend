import type { IUserRepository } from '@/modules/auth/domain/auth.iface'
import { NotFoundError } from '../../../shared/presentation/errors'
import type { IStaffRepository } from '../domain/staff.iface'

export class DeleteStaffMemberUseCase {
  async execute(
    id: string,
    staffRepo: IStaffRepository,
    userRepo: IUserRepository,
  ): Promise<void> {
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

    // Delete staff member (this will cascade or we need to handle user deletion)
    await staffRepo.delete(id)

    // Delete associated user
    await userRepo.delete(existing.userId)
  }
}
