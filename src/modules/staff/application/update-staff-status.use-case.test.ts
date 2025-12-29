import { beforeEach, describe, expect, it, mock } from "bun:test";
import { NotFoundError } from "../../../shared/presentation/errors";
import type { StaffMember } from "../domain/staff.entity";
import type { IStaffRepository } from "../domain/staff.iface";
import { UpdateStaffStatusUseCase } from "./update-staff-status.use-case";

describe("UpdateStaffStatusUseCase", () => {
  let useCase: UpdateStaffStatusUseCase;
  let mockRepo: IStaffRepository;

  beforeEach(() => {
    useCase = new UpdateStaffStatusUseCase();
    mockRepo = {
      findAll: mock(() => Promise.resolve([])),
      findById: mock(() => Promise.resolve(null)),
      findByUserId: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as StaffMember)),
      update: mock(() => Promise.resolve({} as StaffMember)),
      delete: mock(() => Promise.resolve()),
    };
  });

  it("should update staff member online status to true", async () => {
    const existingStaff: StaffMember = {
      id: "staff-1",
      userId: "user-1",
      name: "John Driver",
      username: "johndriver",
      role: "driver",
      phone: "1234567890",
      activeOrders: 1,
      specialization: "groceries",
      isOnline: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedStaff: StaffMember = {
      ...existingStaff,
      isOnline: true,
    };

    mockRepo.findById = mock(() => Promise.resolve(existingStaff));
    mockRepo.update = mock(() => Promise.resolve(updatedStaff));

    const result = await useCase.execute("staff-1", true, mockRepo);

    expect(result).toEqual(updatedStaff);
    expect(mockRepo.findById).toHaveBeenCalledWith("staff-1");
    expect(mockRepo.update).toHaveBeenCalledWith("staff-1", { isOnline: true });
  });

  it("should update staff member online status to false", async () => {
    const existingStaff: StaffMember = {
      id: "staff-1",
      userId: "user-1",
      name: "John Driver",
      username: "johndriver",
      role: "driver",
      phone: "1234567890",
      activeOrders: 1,
      specialization: "groceries",
      isOnline: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedStaff: StaffMember = {
      ...existingStaff,
      isOnline: false,
    };

    mockRepo.findById = mock(() => Promise.resolve(existingStaff));
    mockRepo.update = mock(() => Promise.resolve(updatedStaff));

    const result = await useCase.execute("staff-1", false, mockRepo);

    expect(result).toEqual(updatedStaff);
    expect(mockRepo.findById).toHaveBeenCalledWith("staff-1");
    expect(mockRepo.update).toHaveBeenCalledWith("staff-1", {
      isOnline: false,
    });
  });

  it("should throw NotFoundError when staff member not found", async () => {
    mockRepo.findById = mock(() => Promise.resolve(null));

    await expect(
      useCase.execute("non-existent-id", true, mockRepo)
    ).rejects.toThrow(NotFoundError);
    try {
      await useCase.execute("non-existent-id", true, mockRepo);
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        expect(error.details).toBeDefined();
        expect(error.details[0].message).toBe("Staff member not found");
      } else {
        throw error;
      }
    }
    expect(mockRepo.update).not.toHaveBeenCalled();
  });
});
