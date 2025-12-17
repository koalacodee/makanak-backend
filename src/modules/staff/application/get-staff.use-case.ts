import type { IStaffRepository } from "../domain/staff.iface";
import type { StaffMember, StaffRole } from "../domain/staff.entity";

export class GetStaffUseCase {
  async execute(
    role: StaffRole | undefined,
    repo: IStaffRepository
  ): Promise<StaffMember[]> {
    return await repo.findAll(role);
  }
}
