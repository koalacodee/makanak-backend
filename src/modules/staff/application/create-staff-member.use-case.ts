import { BadRequestError } from "../../../shared/presentation/errors";
import type { IUserRepository } from "../../auth/domain/auth.iface";
import type { StaffMember } from "../domain/staff.entity";
import type { IStaffRepository } from "../domain/staff.iface";

export class CreateStaffMemberUseCase {
  async execute(
    data: {
      name: string;
      username: string;
      password: string;
      role: "admin" | "driver" | "cs" | "inventory";
      phone?: string;
      specialization?: string;
    },
    staffRepo: IStaffRepository,
    userRepo: IUserRepository
  ): Promise<StaffMember> {
    // Check if username already exists
    const existingUser = await userRepo.findByUsername(data.username);
    if (existingUser) {
      throw new BadRequestError([
        {
          path: "username",
          message: "Username already exists",
        },
      ]);
    }

    // Validate required fields
    if (!data.name || !data.name.trim()) {
      throw new BadRequestError([
        {
          path: "name",
          message: "Name is required",
        },
      ]);
    }

    if (!data.username || !data.username.trim()) {
      throw new BadRequestError([
        {
          path: "username",
          message: "Username is required",
        },
      ]);
    }

    if (!data.password || data.password.length < 6) {
      throw new BadRequestError([
        {
          path: "password",
          message: "Password must be at least 6 characters",
        },
      ]);
    }

    // Hash password
    const passwordHash = await Bun.password.hash(data.password, "argon2id");

    // Create user first
    const userId = Bun.randomUUIDv7();
    await userRepo.create({
      id: userId,
      username: data.username,
      passwordHash,
      role: data.role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
    });

    // Create staff member
    return await staffRepo.create({
      userId,
      name: data.name,
      phone: data.phone,
      specialization: data.specialization,
      activeOrders: 0,
      isOnline: false,
    });
  }
}
