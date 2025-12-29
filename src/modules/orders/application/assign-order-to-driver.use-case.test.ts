import { describe, it, expect, beforeEach, mock } from "bun:test";
import { AssignOrderToDriverUseCase } from "./assign-order-to-driver.use-case";
import type { IOrderRepository } from "../domain/orders.iface";
import type { IStaffRepository } from "@/modules/staff/domain/staff.iface";
import type { Order } from "../domain/order.entity";
import type { StaffMember } from "@/modules/staff/domain/staff.entity";
import {
  NotFoundError,
  BadRequestError,
} from "../../../shared/presentation/errors";

describe("AssignOrderToDriverUseCase", () => {
  let useCase: AssignOrderToDriverUseCase;
  let mockOrderRepo: IOrderRepository;
  let mockStaffRepo: IStaffRepository;

  beforeEach(() => {
    useCase = new AssignOrderToDriverUseCase();
    mockOrderRepo = {
      findAll: mock(() => Promise.resolve({ data: [], total: 0 })),
      findById: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Order)),
      update: mock(() => Promise.resolve({} as Order)),
      getReadyOrdersForDriver: mock(() =>
        Promise.resolve({ orders: [], counts: [] })
      ),
      count: mock(() => Promise.resolve(0)),
      saveCancellation: mock(() => Promise.resolve({} as any)),
    };
    mockStaffRepo = {
      findAll: mock(() => Promise.resolve([])),
      findById: mock(() => Promise.resolve(null)),
      findByUserId: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as StaffMember)),
      update: mock(() => Promise.resolve({} as StaffMember)),
      delete: mock(() => Promise.resolve()),
    };
  });

  it("should assign order to driver successfully", async () => {
    const mockOrder: Order = {
      id: "order-1",
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      orderItems: [],
      total: 100,
      status: "ready",
      driverId: undefined,
      createdAt: new Date().toISOString(),
    };

    const mockStaff: StaffMember = {
      id: "driver-1",
      userId: "user-1",
      name: "Driver One",
      username: "driver1",
      role: "driver",
      phone: "0987654321",
      activeOrders: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedOrder: Order = {
      ...mockOrder,
      driverId: "driver-1",
    };

    mockOrderRepo.findById = mock(() => Promise.resolve(mockOrder));
    mockStaffRepo.findById = mock(() => Promise.resolve(mockStaff));
    mockOrderRepo.update = mock(() => Promise.resolve(updatedOrder));

    const result = await useCase.execute(
      "order-1",
      "driver-1",
      mockOrderRepo,
      mockStaffRepo
    );

    expect(result.driverId).toBe("driver-1");
    expect(mockOrderRepo.findById).toHaveBeenCalledWith("order-1");
    expect(mockStaffRepo.findById).toHaveBeenCalledWith("driver-1");
    expect(mockOrderRepo.update).toHaveBeenCalledWith("order-1", {
      driverId: "driver-1",
    });
  });

  it("should throw NotFoundError when order not found", async () => {
    mockOrderRepo.findById = mock(() => Promise.resolve(null));

    await expect(
      useCase.execute("non-existent", "driver-1", mockOrderRepo, mockStaffRepo)
    ).rejects.toThrow(NotFoundError);

    expect(mockOrderRepo.findById).toHaveBeenCalledWith("non-existent");
    expect(mockStaffRepo.findById).not.toHaveBeenCalled();
  });

  it("should throw BadRequestError when order already assigned", async () => {
    const mockOrder: Order = {
      id: "order-1",
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      orderItems: [],
      total: 100,
      status: "ready",
      driverId: "driver-2",
      createdAt: new Date().toISOString(),
    };

    mockOrderRepo.findById = mock(() => Promise.resolve(mockOrder));

    await expect(
      useCase.execute("order-1", "driver-1", mockOrderRepo, mockStaffRepo)
    ).rejects.toThrow(BadRequestError);

    expect(mockStaffRepo.findById).not.toHaveBeenCalled();
    expect(mockOrderRepo.update).not.toHaveBeenCalled();
  });

  it("should throw NotFoundError when staff member not found", async () => {
    const mockOrder: Order = {
      id: "order-1",
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      orderItems: [],
      total: 100,
      status: "ready",
      driverId: undefined,
      createdAt: new Date().toISOString(),
    };

    mockOrderRepo.findById = mock(() => Promise.resolve(mockOrder));
    mockStaffRepo.findById = mock(() => Promise.resolve(null));

    await expect(
      useCase.execute("order-1", "non-existent", mockOrderRepo, mockStaffRepo)
    ).rejects.toThrow(NotFoundError);

    expect(mockOrderRepo.update).not.toHaveBeenCalled();
  });

  it("should throw BadRequestError when staff member is not a driver", async () => {
    const mockOrder: Order = {
      id: "order-1",
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      orderItems: [],
      total: 100,
      status: "ready",
      driverId: undefined,
      createdAt: new Date().toISOString(),
    };

    const mockStaff: StaffMember = {
      id: "staff-1",
      userId: "user-1",
      name: "Staff One",
      username: "staff1",
      role: "inventory",
      phone: "0987654321",
      activeOrders: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockOrderRepo.findById = mock(() => Promise.resolve(mockOrder));
    mockStaffRepo.findById = mock(() => Promise.resolve(mockStaff));

    await expect(
      useCase.execute("order-1", "staff-1", mockOrderRepo, mockStaffRepo)
    ).rejects.toThrow(BadRequestError);

    expect(mockOrderRepo.update).not.toHaveBeenCalled();
  });
});
