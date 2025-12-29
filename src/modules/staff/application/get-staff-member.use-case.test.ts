import { beforeEach, describe, expect, it, mock } from "bun:test";
import { NotFoundError } from "../../../shared/presentation/errors";
import type { StaffMember } from "../domain/staff.entity";
import type { IStaffRepository } from "../domain/staff.iface";
import { GetStaffMemberUseCase } from "./get-staff-member.use-case";

describe("GetStaffMemberUseCase", () => {
  let useCase: GetStaffMemberUseCase;
  let mockRepo: IStaffRepository;

  beforeEach(() => {
    useCase = new GetStaffMemberUseCase();
    mockRepo = {
      findAll: mock(() => Promise.resolve([])),
      findById: mock(() => Promise.resolve(null)),
      findByUserId: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as StaffMember)),
      update: mock(() => Promise.resolve({} as StaffMember)),
      delete: mock(() => Promise.resolve()),
    };
  });

  it("should return staff member when found", async () => {
    const mockStaff: StaffMember = {
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

    mockRepo.findById = mock(() => Promise.resolve(mockStaff));

    const result = await useCase.execute("staff-1", mockRepo);

    expect(result).toEqual(mockStaff);
    expect(mockRepo.findById).toHaveBeenCalledWith("staff-1");
  });

  it("should throw NotFoundError when staff member not found", async () => {
    mockRepo.findById = mock(() => Promise.resolve(null));

    await expect(useCase.execute("non-existent-id", mockRepo)).rejects.toThrow(
      NotFoundError
    );
    try {
      await useCase.execute("non-existent-id", mockRepo);
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        expect(error.details).toBeDefined();
        expect(error.details[0].message).toBe("Staff member not found");
      } else {
        throw error;
      }
    }
    expect(mockRepo.findById).toHaveBeenCalledWith("non-existent-id");
  });
});
