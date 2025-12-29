import type { StaffMember, StaffRole } from "../domain/staff.entity";
import type { IStaffRepository } from "../domain/staff.iface";

export class GetStaffUseCase {
	async execute(
		role: StaffRole | undefined,
		repo: IStaffRepository,
	): Promise<StaffMember[]> {
		return await repo.findAll(role);
	}
}
