import { describe, it, expect, beforeEach, mock } from "bun:test";
import { GetOrdersUseCase } from "./get-orders.use-case";
import type { IOrderRepository } from "../domain/orders.iface";
import type { Order } from "../domain/order.entity";
import { ValidationError } from "../../../shared/presentation/errors";

describe("GetOrdersUseCase", () => {
  let useCase: GetOrdersUseCase;
  let mockRepo: IOrderRepository;

  beforeEach(() => {
    useCase = new GetOrdersUseCase();
    mockRepo = {
      findAll: mock(() => Promise.resolve({ data: [], total: 0 })),
      findById: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Order)),
      update: mock(() => Promise.resolve({} as Order)),
    };
  });

  it("should return orders with pagination", async () => {
    const mockOrder: Order = {
      id: "1",
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      items: [],
      total: "100.00",
      status: "pending",
      createdAt: new Date(),
    };

    mockRepo.findAll = mock(() =>
      Promise.resolve({ data: [mockOrder], total: 1 })
    );

    const result = await useCase.execute(
      { page: 1, limit: 20 },
      mockRepo
    );

    expect(result.data).toEqual([mockOrder]);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(20);
    expect(result.pagination.total).toBe(1);
    expect(result.pagination.totalPages).toBe(1);
  });

  it("should use default pagination values", async () => {
    await useCase.execute({}, mockRepo);

    expect(mockRepo.findAll).toHaveBeenCalledWith({
      status: undefined,
      driverId: undefined,
      page: 1,
      limit: 20,
    });
  });

  it("should filter by status", async () => {
    await useCase.execute({ status: "pending" }, mockRepo);

    expect(mockRepo.findAll).toHaveBeenCalledWith({
      status: "pending",
      driverId: undefined,
      page: 1,
      limit: 20,
    });
  });

  it("should filter by driverId", async () => {
    await useCase.execute({ driverId: "driver-1" }, mockRepo);

    expect(mockRepo.findAll).toHaveBeenCalledWith({
      status: undefined,
      driverId: "driver-1",
      page: 1,
      limit: 20,
    });
  });

  it("should calculate totalPages correctly", async () => {
    mockRepo.findAll = mock(() =>
      Promise.resolve({ data: [], total: 50 })
    );

    const result = await useCase.execute(
      { page: 1, limit: 20 },
      mockRepo
    );

    expect(result.pagination.totalPages).toBe(3);
  });

  it("should throw ValidationError for invalid page", async () => {
    await expect(useCase.execute({ page: 0 }, mockRepo)).rejects.toThrow(
      ValidationError
    );
  });

  it("should throw ValidationError for invalid limit (too low)", async () => {
    await expect(useCase.execute({ limit: 0 }, mockRepo)).rejects.toThrow(
      ValidationError
    );
  });

  it("should throw ValidationError for invalid limit (too high)", async () => {
    await expect(useCase.execute({ limit: 101 }, mockRepo)).rejects.toThrow(
      ValidationError
    );
  });
});

