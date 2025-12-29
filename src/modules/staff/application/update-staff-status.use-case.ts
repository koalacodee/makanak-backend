import { NotFoundError } from '../../../shared/presentation/errors'
import type { StaffMember } from '../domain/staff.entity'
import type { IStaffRepository } from '../domain/staff.iface'

export class UpdateStaffStatusUseCase {
  async execute(
    id: string,
    isOnline: boolean,
    repo: IStaffRepository,
  ): Promise<StaffMember> {
    // Check if staff member exists
    const existing = await repo.findById(id)
    if (!existing) {
      throw new NotFoundError([
        {
          path: 'staff',
          message: 'Staff member not found',
        },
      ])
    }

    return await repo.update(id, { isOnline })
  }
}
