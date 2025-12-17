import type { IStaffRepository } from "../domain/staff.iface";
import type { StaffMember } from "../domain/staff.entity";
import { NotFoundError } from "../../../shared/presentation/errors";

export class GetStaffMemberUseCase {
  async execute(id: string, repo: IStaffRepository): Promise<StaffMember> {
    const staffMember = await repo.findById(id);
    if (!staffMember) {
      throw new NotFoundError([
        {
          path: "staff",
          message: "Staff member not found",
        },
      ]);
    }
    return staffMember;
  }
}
