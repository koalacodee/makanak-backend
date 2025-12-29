import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { MarkAsReadyUseCase } from "./mark-as-ready.use-case";
import type { IOrderRepository } from "../../orders/domain/orders.iface";
import type { Order } from "../../orders/domain/order.entity";
import {
  NotFoundError,
  BadRequestError,
} from "../../../shared/presentation/errors";
import redis from "@/shared/redis";
import { driversIO } from "@/socket.io";

describe("MarkAsReadyUseCase", () => {
  let useCase: MarkAsReadyUseCase;
  let mockOrderRepo: IOrderRepository;
  let originalSend: typeof redis.send;
  let originalRpush: typeof redis.rpush;
  let originalNotifyDriverWithReadyOrder: typeof driversIO.notifyDriverWithReadyOrder;

  beforeEach(() => {
    useCase = new MarkAsReadyUseCase();
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
    originalSend = redis.send;
    originalRpush = redis.rpush;
    originalNotifyDriverWithReadyOrder = driversIO.notifyDriverWithReadyOrder;
    redis.send = mock(() => Promise.resolve("driver-1")) as typeof redis.send;
    redis.rpush = mock(() => Promise.resolve(1)) as typeof redis.rpush;
    driversIO.notifyDriverWithReadyOrder = mock(
      () => {}
    ) as typeof driversIO.notifyDriverWithReadyOrder;
  });

  afterEach(() => {
    redis.send = originalSend;
    redis.rpush = originalRpush;
    driversIO.notifyDriverWithReadyOrder = originalNotifyDriverWithReadyOrder;
  });

  it("should mark order as ready and assign driver when available", async () => {
    const mockOrder: Order = {
      id: "order-1",
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      orderItems: [
        {
          id: "item-1",
          orderId: "order-1",
          productId: "prod-1",
          quantity: 2,
          price: 50,
          productName: "Product 1",
          productStock: 100,
          productQuantityType: "count",
        },
      ],
      total: 100,
      status: "processing",
      driverId: undefined,
      createdAt: new Date().toISOString(),
      paymentMethod: "cod",
    };

    const updatedOrder: Order = {
      ...mockOrder,
      driverId: "driver-1",
      status: "ready",
    };

    mockOrderRepo.findById = mock(() => Promise.resolve(mockOrder));
    mockOrderRepo.update = mock(() => Promise.resolve(updatedOrder));
    redis.send = mock(() => Promise.resolve("driver-1")) as typeof redis.send;

    const result = await useCase.execute("order-1", mockOrderRepo);

    expect(result.success).toBe(true);
    expect(result.driverId).toBe("driver-1");
    expect(mockOrderRepo.findById).toHaveBeenCalledWith("order-1");
    expect(mockOrderRepo.update).toHaveBeenCalledWith("order-1", {
      driverId: "driver-1",
    });
    expect(redis.send).toHaveBeenCalledWith(
      "EVAL",
      expect.arrayContaining(["available_drivers", "busy_drivers"])
    );
    expect(driversIO.notifyDriverWithReadyOrder).toHaveBeenCalledWith(
      "driver-1",
      expect.objectContaining({
        id: "order-1",
        shouldTake: 100,
      })
    );
  });

  it("should add order to idle queue when no driver available", async () => {
    const mockOrder: Order = {
      id: "order-1",
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      orderItems: [],
      total: 100,
      status: "processing",
      driverId: undefined,
      createdAt: new Date().toISOString(),
      paymentMethod: "online",
    };

    mockOrderRepo.findById = mock(() => Promise.resolve(mockOrder));
    redis.send = mock(() => Promise.resolve(null)) as typeof redis.send;

    const result = await useCase.execute("order-1", mockOrderRepo);

    expect(result.success).toBe(true);
    expect(result.driverId).toBeUndefined();
    expect(redis.rpush).toHaveBeenCalledWith("idle_ready_orders", "order-1");
    expect(mockOrderRepo.update).not.toHaveBeenCalled();
    expect(driversIO.notifyDriverWithReadyOrder).not.toHaveBeenCalled();
  });

  it("should throw NotFoundError when order not found", async () => {
    mockOrderRepo.findById = mock(() => Promise.resolve(null));

    await expect(
      useCase.execute("non-existent", mockOrderRepo)
    ).rejects.toThrow(NotFoundError);

    expect(redis.send).not.toHaveBeenCalled();
    expect(redis.rpush).not.toHaveBeenCalled();
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
      driverId: "driver-1",
      createdAt: new Date().toISOString(),
    };

    mockOrderRepo.findById = mock(() => Promise.resolve(mockOrder));

    await expect(useCase.execute("order-1", mockOrderRepo)).rejects.toThrow(
      BadRequestError
    );

    expect(redis.send).not.toHaveBeenCalled();
    expect(redis.rpush).not.toHaveBeenCalled();
  });
});
