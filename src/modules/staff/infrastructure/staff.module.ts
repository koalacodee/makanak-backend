import { Elysia } from "elysia";
import db from "../../../drizzle";
import { UserRepository } from "../../auth/infrastructure/user.repository";
import { CreateStaffMemberUseCase } from "../application/create-staff-member.use-case";
import { DeleteStaffMemberUseCase } from "../application/delete-staff-member.use-case";
import { GetStaffUseCase } from "../application/get-staff.use-case";
import { GetStaffMemberUseCase } from "../application/get-staff-member.use-case";
import { UpdateStaffMemberUseCase } from "../application/update-staff-member.use-case";
import { UpdateStaffStatusUseCase } from "../application/update-staff-status.use-case";
import { StaffRepository } from "./staff.repository";

export const staffModule = new Elysia({ name: "staffModule" })
	.decorate("staffRepo", new StaffRepository(db))
	.decorate("userRepo", new UserRepository(db))
	.decorate("getStaffUC", new GetStaffUseCase())
	.decorate("getStaffMemberUC", new GetStaffMemberUseCase())
	.decorate("createStaffMemberUC", new CreateStaffMemberUseCase())
	.decorate("updateStaffMemberUC", new UpdateStaffMemberUseCase())
	.decorate("deleteStaffMemberUC", new DeleteStaffMemberUseCase())
	.decorate("updateStaffStatusUC", new UpdateStaffStatusUseCase());
