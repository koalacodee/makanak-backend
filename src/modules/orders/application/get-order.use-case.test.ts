import { describe, it, expect, beforeEach, mock } from "bun:test";
import { GetOrderUseCase } from "./get-order.use-case";
import type { IOrderRepository } from "../domain/orders.iface";
import type { Order } from "../domain/order.entity";
import { NotFoundError } from "../../../shared/presentation/errors";

describe("GetOrderUseCase", () => {
  let useCase: GetOrderUseCase;
  let mockRepo: IOrderRepository;

  beforeEach(() => {
    useCase = new GetOrderUseCase();
    mockRepo = {
      findAll: mock(() => Promise.resolve({ data: [], total: 0 })),
      findById: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Order)),
      update: mock(() => Promise.resolve({} as Order)),
    };
  });

  it("should return order when found", async () => {
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

    mockRepo.findById = mock(() => Promise.resolve(mockOrder));

    const result = await useCase.execute("1", mockRepo);

    expect(result).toEqual(mockOrder);
    expect(mockRepo.findById).toHaveBeenCalledWith("1");
  });

  it("should throw NotFoundError when order not found", async () => {
    mockRepo.findById = mock(() => Promise.resolve(null));

    await expect(useCase.execute("non-existent", mockRepo)).rejects.toThrow(
      NotFoundError
    );
    expect(mockRepo.findById).toHaveBeenCalledWith("non-existent");
  });
});

