import { describe, it, expect, beforeEach, mock } from "bun:test";
import { CreateOrderUseCase } from "./create-order.use-case";
import type { IOrderRepository } from "../domain/orders.iface";
import type { Order } from "../domain/order.entity";
import { BadRequestError } from "../../../shared/presentation/errors";

describe("CreateOrderUseCase", () => {
  let useCase: CreateOrderUseCase;
  let mockRepo: IOrderRepository;

  beforeEach(() => {
    useCase = new CreateOrderUseCase();
    mockRepo = {
      findAll: mock(() => Promise.resolve({ data: [], total: 0 })),
      findById: mock(() => Promise.resolve(null)),
      create: mock(() =>
        Promise.resolve({
          id: "new-id",
          customerName: "John Doe",
          phone: "1234567890",
          address: "123 Main St",
          items: [],
          total: "100.00",
          status: "pending",
          createdAt: new Date(),
        })
      ),
      update: mock(() => Promise.resolve({} as Order)),
    };
  });

  it("should create order successfully", async () => {
    const orderData = {
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      items: [{ id: "product-1", quantity: 2 }],
      paymentMethod: "cod" as const,
    };

    const result = await useCase.execute(orderData, mockRepo);

    expect(result.id).toBe("new-id");
    expect(mockRepo.create).toHaveBeenCalled();
  });

  it("should throw BadRequestError for empty items array", async () => {
    const orderData = {
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      items: [],
      paymentMethod: "cod" as const,
    };

    await expect(useCase.execute(orderData, mockRepo)).rejects.toThrow(
      BadRequestError
    );
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it("should throw BadRequestError for zero quantity", async () => {
    const orderData = {
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      items: [{ id: "product-1", quantity: 0 }],
      paymentMethod: "cod" as const,
    };

    await expect(useCase.execute(orderData, mockRepo)).rejects.toThrow(
      BadRequestError
    );
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it("should throw BadRequestError for negative quantity", async () => {
    const orderData = {
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      items: [{ id: "product-1", quantity: -1 }],
      paymentMethod: "cod" as const,
    };

    await expect(useCase.execute(orderData, mockRepo)).rejects.toThrow(
      BadRequestError
    );
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it("should allow optional fields", async () => {
    const orderData = {
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      items: [{ id: "product-1", quantity: 2 }],
      paymentMethod: "cod" as const,
      subtotal: 90.0,
      deliveryFee: 10.0,
      pointsUsed: 100,
      pointsDiscount: 5.0,
    };

    await useCase.execute(orderData, mockRepo);

    expect(mockRepo.create).toHaveBeenCalled();
  });
});

