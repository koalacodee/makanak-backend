import { describe, it, expect, beforeEach, mock } from "bun:test";
import { GetStaffUseCase } from "./get-staff.use-case";
import type { IStaffRepository } from "../domain/staff.iface";
import type { StaffMember } from "../domain/staff.entity";

describe("GetStaffUseCase", () => {
  let useCase: GetStaffUseCase;
  let mockRepo: IStaffRepository;

  beforeEach(() => {
    useCase = new GetStaffUseCase();
    mockRepo = {
      findAll: mock(() => Promise.resolve([])),
      findById: mock(() => Promise.resolve(null)),
      findByUserId: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as StaffMember)),
      update: mock(() => Promise.resolve({} as StaffMember)),
      delete: mock(() => Promise.resolve()),
    };
  });

  it("should return all staff members when no role filter is provided", async () => {
    const mockStaff: StaffMember[] = [
      {
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
      },
      {
        id: "staff-2",
        userId: "user-2",
        name: "Jane Driver",
        username: "janedriver",
        role: "driver",
        phone: "0987654321",
        activeOrders: 2,
        specialization: "groceries",
        isOnline: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockRepo.findAll = mock(() => Promise.resolve(mockStaff));

    const result = await useCase.execute(undefined, mockRepo);

    expect(result).toEqual(mockStaff);
    expect(mockRepo.findAll).toHaveBeenCalledWith(undefined);
  });

  it("should return filtered staff members when role filter is provided", async () => {
    const mockStaff: StaffMember[] = [
      {
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
      },
    ];

    mockRepo.findAll = mock(() => Promise.resolve(mockStaff));

    const result = await useCase.execute("driver", mockRepo);

    expect(result).toEqual(mockStaff);
    expect(mockRepo.findAll).toHaveBeenCalledWith("driver");
  });

  it("should return empty array when no staff members exist", async () => {
    mockRepo.findAll = mock(() => Promise.resolve([]));

    const result = await useCase.execute(undefined, mockRepo);

    expect(result).toEqual([]);
    expect(mockRepo.findAll).toHaveBeenCalledWith(undefined);
  });
});
