import { beforeEach, describe, expect, it, mock } from "bun:test";
import { NotFoundError } from "../../../shared/presentation/errors";
import type { StaffMember } from "../domain/staff.entity";
import type { IStaffRepository } from "../domain/staff.iface";
import { UpdateStaffMemberUseCase } from "./update-staff-member.use-case";
import { IUserRepository } from "@/modules/auth/domain/auth.iface";
import { User } from "@/modules/auth/domain/user.entity";

describe("UpdateStaffMemberUseCase", () => {
  let useCase: UpdateStaffMemberUseCase;
  let mockStaffRepo: IStaffRepository;
  let mockUserRepo: IUserRepository;

  beforeEach(() => {
    useCase = new UpdateStaffMemberUseCase();
    mockStaffRepo = {
      findAll: mock(() => Promise.resolve([])),
      findById: mock(() => Promise.resolve(null)),
      findByUserId: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as StaffMember)),
      update: mock(() => Promise.resolve({} as StaffMember)),
      delete: mock(() => Promise.resolve()),
    };
    mockUserRepo = {
      update: mock(() => Promise.resolve({} as User)),
      findByUsername: mock(() => Promise.resolve(null)),
      findById: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as User)),
      delete: mock(() => Promise.resolve()),
      updateLastLogin: mock(() => Promise.resolve()),
    };
  });

  it("should update staff member successfully", async () => {
    const existingStaff: StaffMember = {
      id: "staff-1",
      userId: "user-1",
      name: "John Doe",
      username: "johndoe",
      role: "admin",
      phone: "1234567890",
      activeOrders: null,
      specialization: null,
      isOnline: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedStaff: StaffMember = {
      ...existingStaff,
      name: "John Updated",
      phone: "9999999999",
    };

    mockStaffRepo.findById = mock(() => Promise.resolve(existingStaff));
    mockStaffRepo.update = mock(() => Promise.resolve(updatedStaff));

    const result = await useCase.execute(
      "staff-1",
      { name: "John Updated", phone: "9999999999" },
      mockStaffRepo,
      mockUserRepo
    );

    expect(result).toEqual(updatedStaff);
    expect(mockStaffRepo.findById).toHaveBeenCalledWith("staff-1");
    expect(mockStaffRepo.update).toHaveBeenCalledWith("staff-1", {
      name: "John Updated",
      phone: "9999999999",
    });
    expect(mockUserRepo.update).not.toHaveBeenCalled();
  });

  it("should update user when username changes", async () => {
    const existingStaff: StaffMember = {
      id: "staff-1",
      userId: "user-1",
      name: "John Doe",
      username: "johndoe",
      role: "admin",
      phone: null,
      activeOrders: null,
      specialization: null,
      isOnline: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedStaff: StaffMember = {
      ...existingStaff,
      username: "johnnew",
    };

    mockStaffRepo.findById = mock(() => Promise.resolve(existingStaff));
    mockStaffRepo.update = mock(() => Promise.resolve(updatedStaff));
    mockUserRepo.update = mock(() => Promise.resolve({} as User));

    await useCase.execute(
      "staff-1",
      { username: "johnnew" },
      mockStaffRepo,
      mockUserRepo
    );

    expect(mockUserRepo.update).toHaveBeenCalledWith("user-1", {
      username: "johnnew",
    });
  });

  it("should update user when password changes", async () => {
    const existingStaff: StaffMember = {
      id: "staff-1",
      userId: "user-1",
      name: "John Doe",
      username: "johndoe",
      role: "admin",
      phone: null,
      activeOrders: null,
      specialization: null,
      isOnline: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockStaffRepo.findById = mock(() => Promise.resolve(existingStaff));
    mockStaffRepo.update = mock(() => Promise.resolve(existingStaff));
    mockUserRepo.update = mock(() => Promise.resolve({} as User));

    await useCase.execute(
      "staff-1",
      { password: "newpassword123" },
      mockStaffRepo,
      mockUserRepo
    );

    expect(mockUserRepo.update).toHaveBeenCalledWith("user-1", {
      passwordHash: expect.any(String),
    });
  });

  it("should update user when role changes", async () => {
    const existingStaff: StaffMember = {
      id: "staff-1",
      userId: "user-1",
      name: "John Doe",
      username: "johndoe",
      role: "admin",
      phone: null,
      activeOrders: null,
      specialization: null,
      isOnline: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockStaffRepo.findById = mock(() => Promise.resolve(existingStaff));
    mockStaffRepo.update = mock(() => Promise.resolve(existingStaff));
    mockUserRepo.update = mock(() => Promise.resolve({} as User));

    await useCase.execute(
      "staff-1",
      { role: "driver" },
      mockStaffRepo,
      mockUserRepo
    );

    expect(mockUserRepo.update).toHaveBeenCalledWith("user-1", {
      role: "driver",
    });
  });

  it("should update multiple fields at once", async () => {
    const existingStaff: StaffMember = {
      id: "staff-1",
      userId: "user-1",
      name: "John Doe",
      username: "johndoe",
      role: "admin",
      phone: null,
      activeOrders: null,
      specialization: null,
      isOnline: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedStaff: StaffMember = {
      ...existingStaff,
      name: "John Updated",
      phone: "9999999999",
      specialization: "groceries",
    };

    mockStaffRepo.findById = mock(() => Promise.resolve(existingStaff));
    mockStaffRepo.update = mock(() => Promise.resolve(updatedStaff));

    await useCase.execute(
      "staff-1",
      {
        name: "John Updated",
        phone: "9999999999",
        specialization: "groceries",
      },
      mockStaffRepo,
      mockUserRepo
    );

    expect(mockStaffRepo.update).toHaveBeenCalledWith("staff-1", {
      name: "John Updated",
      phone: "9999999999",
      specialization: "groceries",
    });
  });

  it("should throw NotFoundError when staff member not found", async () => {
    mockStaffRepo.findById = mock(() => Promise.resolve(null));

    await expect(
      useCase.execute(
        "non-existent-id",
        { name: "Updated Name" },
        mockStaffRepo,
        mockUserRepo
      )
    ).rejects.toThrow(NotFoundError);
    try {
      await useCase.execute(
        "non-existent-id",
        { name: "Updated Name" },
        mockStaffRepo,
        mockUserRepo
      );
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        expect(error.details).toBeDefined();
        expect(error.details[0].message).toBe("Staff member not found");
      } else {
        throw error;
      }
    }
    expect(mockStaffRepo.update).not.toHaveBeenCalled();
  });
});
