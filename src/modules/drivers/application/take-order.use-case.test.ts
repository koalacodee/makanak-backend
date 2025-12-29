import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import redis from "@/shared/redis";
import {
  NotFoundError,
  UnauthorizedError,
} from "../../../shared/presentation/errors";
import type {
  Order,
  OrderCancellation,
} from "../../orders/domain/order.entity";
import type { IOrderRepository } from "../../orders/domain/orders.iface";
import { TakeOrderUseCase } from "./take-order.use-case";

describe("TakeOrderUseCase", () => {
  let useCase: TakeOrderUseCase;
  let mockOrderRepo: IOrderRepository;
  let originalSadd: typeof redis.sadd;
  let originalLrem: typeof redis.lrem;

  beforeEach(() => {
    useCase = new TakeOrderUseCase();
    mockOrderRepo = {
      findAll: mock(() => Promise.resolve({ data: [], total: 0 })),
      findById: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Order)),
      update: mock(() => Promise.resolve({} as Order)),
      getReadyOrdersForDriver: mock(() =>
        Promise.resolve({ orders: [], counts: [] })
      ),
      count: mock(() => Promise.resolve(0)),
      saveCancellation: mock(() => Promise.resolve({} as OrderCancellation)),
    };
    originalSadd = redis.sadd;
    originalLrem = redis.lrem;
    redis.sadd = mock(() => Promise.resolve(1)) as typeof redis.sadd;
    redis.lrem = mock(() => Promise.resolve(1)) as typeof redis.lrem;
  });

  afterEach(() => {
    redis.sadd = originalSadd;
    redis.lrem = originalLrem;
  });

  it("should take order successfully", async () => {
    const mockOrder: Order = {
      id: "order-1",
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      orderItems: [],
      total: 100,
      status: "ready",
      driverId: "driver-1",
      createdAt: new Date().toISOString(),
      paymentMethod: "cod",
    };

    const updatedOrder: Order = {
      ...mockOrder,
      status: "out_for_delivery",
    };

    mockOrderRepo.findById = mock(() => Promise.resolve(mockOrder));
    mockOrderRepo.update = mock(() => Promise.resolve(updatedOrder));

    const result = await useCase.execute("order-1", "driver-1", mockOrderRepo);

    expect(result.status).toBe("out_for_delivery");
    expect(mockOrderRepo.findById).toHaveBeenCalledWith("order-1");
    expect(mockOrderRepo.update).toHaveBeenCalledWith("order-1", {
      status: "out_for_delivery",
    });
    expect(redis.sadd).toHaveBeenCalledWith("busy_drivers", "driver-1");
    expect(redis.lrem).toHaveBeenCalledWith("available_drivers", 1, "driver-1");
  });

  it("should throw NotFoundError when order not found", async () => {
    mockOrderRepo.findById = mock(() => Promise.resolve(null));

    await expect(
      useCase.execute("non-existent", "driver-1", mockOrderRepo)
    ).rejects.toThrow(NotFoundError);

    expect(mockOrderRepo.findById).toHaveBeenCalledWith("non-existent");
    expect(redis.sadd).not.toHaveBeenCalled();
    expect(redis.lrem).not.toHaveBeenCalled();
  });

  it("should throw UnauthorizedError when order is not assigned to driver", async () => {
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
      useCase.execute("order-1", "driver-1", mockOrderRepo)
    ).rejects.toThrow(UnauthorizedError);

    expect(redis.sadd).not.toHaveBeenCalled();
    expect(redis.lrem).not.toHaveBeenCalled();
  });
});
