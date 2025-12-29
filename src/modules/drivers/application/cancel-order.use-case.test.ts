import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { CancelOrderUseCase } from "./cancel-order.use-case";
import type { IOrderRepository } from "../../orders/domain/orders.iface";
import type { IProductRepository } from "../../products/domain/products.iface";
import type { ICouponRepository } from "../../coupons/domain/coupon.iface";
import type { ICustomerRepository } from "../../customers/domain/customers.iface";
import type { Order } from "../../orders/domain/order.entity";
import {
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
} from "../../../shared/presentation/errors";
import { ChangeOrderStatusUseCase } from "../../orders/application/change-order-status.use-case";
import { MarkAsReadyUseCase } from "./mark-as-ready.use-case";
import redis from "@/shared/redis";

describe("CancelOrderUseCase", () => {
  let useCase: CancelOrderUseCase;
  let mockOrderRepo: IOrderRepository;
  let mockProductRepo: IProductRepository;
  let mockCouponRepo: ICouponRepository;
  let mockCustomerRepo: ICustomerRepository;
  let mockChangeOrderStatusUC: ChangeOrderStatusUseCase;
  let mockMarkAsReadyUC: MarkAsReadyUseCase;
  let originalSrem: typeof redis.srem;
  let originalRpush: typeof redis.rpush;

  beforeEach(() => {
    useCase = new CancelOrderUseCase();
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
    mockProductRepo = {
      findAll: mock(() => Promise.resolve({ data: [], total: 0 })),
      findById: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as any)),
      update: mock(() => Promise.resolve({} as any)),
      delete: mock(() => Promise.resolve()),
      findByIds: mock(() => Promise.resolve([])),
      existsByIds: mock(() => Promise.resolve(false)),
      updateStock: mock(() => Promise.resolve({} as any)),
      updateStockMany: mock(() => Promise.resolve({} as any)),
    };
    mockCouponRepo = {
      findAll: mock(() => Promise.resolve([])),
      findById: mock(() => Promise.resolve(null)),
      findByName: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as any)),
      update: mock(() => Promise.resolve({} as any)),
      delete: mock(() => Promise.resolve()),
    };
    mockCustomerRepo = {
      findByPhone: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as any)),
      update: mock(() => Promise.resolve({} as any)),
      changePassword: mock(() => Promise.resolve({} as any)),
      upsert: mock(() => Promise.resolve({} as any)),
      getPointsInfo: mock(() => Promise.resolve(null)),
      findAll: mock(() => Promise.resolve([])),
    };
    mockChangeOrderStatusUC = {
      execute: mock(() =>
        Promise.resolve({ order: {} as Order, cancellationPutUrl: undefined })
      ),
    } as any;
    mockMarkAsReadyUC = {} as any;
    originalSrem = redis.srem;
    originalRpush = redis.rpush;
    redis.srem = mock(() => Promise.resolve(1)) as typeof redis.srem;
    redis.rpush = mock(() => Promise.resolve(1)) as typeof redis.rpush;
  });

  afterEach(() => {
    redis.srem = originalSrem;
    redis.rpush = originalRpush;
  });

  it("should cancel order successfully", async () => {
    const mockOrder: Order = {
      id: "order-1",
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      orderItems: [],
      total: 100,
      status: "out_for_delivery",
      driverId: "driver-1",
      createdAt: new Date().toISOString(),
    };

    const cancelledOrder: Order = {
      ...mockOrder,
      status: "cancelled",
    };

    mockOrderRepo.findById = mock(() => Promise.resolve(mockOrder));
    mockChangeOrderStatusUC.execute = mock(() =>
      Promise.resolve({ order: cancelledOrder, cancellationPutUrl: undefined })
    ) as any;

    const result = await useCase.execute(
      "order-1",
      "driver-1",
      { reason: "Customer cancelled" },
      mockOrderRepo,
      mockProductRepo,
      mockCouponRepo,
      mockCustomerRepo,
      mockChangeOrderStatusUC,
      mockMarkAsReadyUC
    );

    expect(result.order.status).toBe("cancelled");
    expect(mockOrderRepo.findById).toHaveBeenCalledWith("order-1");
    expect(mockChangeOrderStatusUC.execute).toHaveBeenCalledWith(
      {
        id: "order-1",
        status: "cancelled",
        cancellation: { reason: "Customer cancelled" },
      },
      mockOrderRepo,
      mockCustomerRepo,
      mockProductRepo,
      mockCouponRepo,
      mockMarkAsReadyUC
    );
    expect(redis.srem).toHaveBeenCalledWith("busy_drivers", "driver-1");
    expect(redis.rpush).toHaveBeenCalledWith("available_drivers", "driver-1");
  });

  it("should throw NotFoundError when order not found", async () => {
    mockOrderRepo.findById = mock(() => Promise.resolve(null));

    await expect(
      useCase.execute(
        "non-existent",
        "driver-1",
        { reason: "Test" },
        mockOrderRepo,
        mockProductRepo,
        mockCouponRepo,
        mockCustomerRepo,
        mockChangeOrderStatusUC,
        mockMarkAsReadyUC
      )
    ).rejects.toThrow(NotFoundError);

    expect(redis.srem).not.toHaveBeenCalled();
    expect(redis.rpush).not.toHaveBeenCalled();
  });

  it("should throw UnauthorizedError when order is not assigned to driver", async () => {
    const mockOrder: Order = {
      id: "order-1",
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      orderItems: [],
      total: 100,
      status: "out_for_delivery",
      driverId: "driver-2",
      createdAt: new Date().toISOString(),
    };

    mockOrderRepo.findById = mock(() => Promise.resolve(mockOrder));

    await expect(
      useCase.execute(
        "order-1",
        "driver-1",
        { reason: "Test" },
        mockOrderRepo,
        mockProductRepo,
        mockCouponRepo,
        mockCustomerRepo,
        mockChangeOrderStatusUC,
        mockMarkAsReadyUC
      )
    ).rejects.toThrow(UnauthorizedError);

    expect(redis.srem).not.toHaveBeenCalled();
    expect(redis.rpush).not.toHaveBeenCalled();
  });

  it("should throw BadRequestError when order status is not out_for_delivery", async () => {
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

    await expect(
      useCase.execute(
        "order-1",
        "driver-1",
        { reason: "Test" },
        mockOrderRepo,
        mockProductRepo,
        mockCouponRepo,
        mockCustomerRepo,
        mockChangeOrderStatusUC,
        mockMarkAsReadyUC
      )
    ).rejects.toThrow(BadRequestError);

    expect(redis.srem).not.toHaveBeenCalled();
    expect(redis.rpush).not.toHaveBeenCalled();
  });
});
