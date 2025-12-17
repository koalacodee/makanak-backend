import { describe, it, expect, beforeEach, mock } from "bun:test";
import { UpdateOrderUseCase } from "./update-order.use-case";
import type { IOrderRepository } from "../domain/orders.iface";
import type { Order } from "../domain/order.entity";
import { NotFoundError } from "../../../shared/presentation/errors";

describe("UpdateOrderUseCase", () => {
  let useCase: UpdateOrderUseCase;
  let mockRepo: IOrderRepository;

  beforeEach(() => {
    useCase = new UpdateOrderUseCase();
    mockRepo = {
      findAll: mock(() => Promise.resolve({ data: [], total: 0 })),
      findById: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Order)),
      update: mock(() =>
        Promise.resolve({
          id: "1",
          customerName: "John Doe",
          phone: "1234567890",
          address: "123 Main St",
          items: [],
          total: "100.00",
          status: "processing",
          createdAt: new Date(),
        })
      ),
    };
  });

  it("should update order status successfully", async () => {
    const existingOrder: Order = {
      id: "1",
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      items: [],
      total: "100.00",
      status: "pending",
      createdAt: new Date(),
    };

    mockRepo.findById = mock(() => Promise.resolve(existingOrder));

    const updateData = { status: "processing" as const };
    const result = await useCase.execute("1", updateData, mockRepo);

    expect(result.status).toBe("processing");
    expect(mockRepo.findById).toHaveBeenCalledWith("1");
    expect(mockRepo.update).toHaveBeenCalledWith("1", updateData);
  });

  it("should update driverId successfully", async () => {
    const existingOrder: Order = {
      id: "1",
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      items: [],
      total: "100.00",
      status: "pending",
      createdAt: new Date(),
    };

    mockRepo.findById = mock(() => Promise.resolve(existingOrder));

    const updateData = { driverId: "driver-1" };
    await useCase.execute("1", updateData, mockRepo);

    expect(mockRepo.update).toHaveBeenCalledWith("1", updateData);
  });

  it("should update receiptImage successfully", async () => {
    const existingOrder: Order = {
      id: "1",
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      items: [],
      total: "100.00",
      status: "pending",
      createdAt: new Date(),
    };

    mockRepo.findById = mock(() => Promise.resolve(existingOrder));

    const updateData = { receiptImage: "base64encodedimage" };
    await useCase.execute("1", updateData, mockRepo);

    expect(mockRepo.update).toHaveBeenCalledWith("1", updateData);
  });

  it("should throw NotFoundError when order not found", async () => {
    mockRepo.findById = mock(() => Promise.resolve(null));

    await expect(
      useCase.execute("non-existent", { status: "processing" }, mockRepo)
    ).rejects.toThrow(NotFoundError);
    expect(mockRepo.update).not.toHaveBeenCalled();
  });
});

