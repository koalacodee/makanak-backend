import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { JoinShiftUseCase } from "./join-shift.use-case";
import type { IOrderRepository } from "../../orders/domain/orders.iface";
import type { Order } from "../../orders/domain/order.entity";
import redis from "@/shared/redis";

describe("JoinShiftUseCase", () => {
  let useCase: JoinShiftUseCase;
  let mockOrderRepo: IOrderRepository;
  let originalSend: typeof redis.send;

  beforeEach(() => {
    useCase = new JoinShiftUseCase();
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
    redis.send = mock(() => Promise.resolve(1)) as typeof redis.send;
  });

  afterEach(() => {
    redis.send = originalSend;
  });

  it("should join shift successfully with existing ready orders", async () => {
    const mockOrders: Order[] = [
      {
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
      },
    ];

    const mockCounts = [
      { status: "ready" as const, count: 1 },
      { status: "out_for_delivery" as const, count: 0 },
    ];

    mockOrderRepo.getReadyOrdersForDriver = mock(() =>
      Promise.resolve({ orders: mockOrders, counts: mockCounts })
    );

    const result = await useCase.execute("driver-1", mockOrderRepo);

    expect(result.success).toBe(true);
    expect(result.readyOrders).toHaveLength(1);
    expect(result.readyOrders[0].shouldTake).toBe(100);
    expect(result.counts).toEqual(mockCounts);
    expect(redis.send).toHaveBeenCalledWith(
      "EVAL",
      expect.arrayContaining(["available_drivers", "driver-1"])
    );
  });

  it("should join shift and assign idle order when no ready orders", async () => {
    // Mock assignFirstIdleReadyOrderToFirstIdleDriver to return a result
    redis.send = mock((command: string, args: any[]) => {
      if (command === "EVAL" && args[0]?.includes("LPOP")) {
        // This is assignFirstIdleReadyOrderToFirstIdleDriver
        return Promise.resolve(["driver-1", "order-2"]);
      }
      // This is ensureDriverInAvailableDrivers
      return Promise.resolve(1);
    }) as typeof redis.send;

    const assignedOrder: Order = {
      id: "order-2",
      customerName: "Jane Doe",
      phone: "0987654321",
      address: "456 Oak Ave",
      orderItems: [],
      total: 200,
      status: "ready",
      driverId: "driver-1",
      createdAt: new Date().toISOString(),
      paymentMethod: "online",
    };

    mockOrderRepo.getReadyOrdersForDriver = mock(() =>
      Promise.resolve({ orders: [], counts: [] })
    );
    mockOrderRepo.update = mock(() => Promise.resolve(assignedOrder));

    const result = await useCase.execute("driver-1", mockOrderRepo);

    expect(result.success).toBe(true);
    expect(result.readyOrders).toHaveLength(1);
    expect(result.readyOrders[0].id).toBe("order-2");
    expect(result.readyOrders[0].shouldTake).toBeNull();
  });

  it("should join shift with no orders when no idle orders available", async () => {
    redis.send = mock((command: string, args: any[]) => {
      if (command === "EVAL" && args[0]?.includes("LPOP")) {
        // assignFirstIdleReadyOrderToFirstIdleDriver returns null
        return Promise.resolve(null);
      }
      // ensureDriverInAvailableDrivers
      return Promise.resolve(1);
    }) as typeof redis.send;

    mockOrderRepo.getReadyOrdersForDriver = mock(() =>
      Promise.resolve({ orders: [], counts: [] })
    );

    const result = await useCase.execute("driver-1", mockOrderRepo);

    expect(result.success).toBe(true);
    expect(result.readyOrders).toHaveLength(0);
  });
});
