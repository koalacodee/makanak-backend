import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { ChangeOrderStatusUseCase } from "./change-order-status.use-case";
import type { IOrderRepository } from "../domain/orders.iface";
import type { IProductRepository } from "@/modules/products/domain/products.iface";
import type { ICouponRepository } from "@/modules/coupons/domain/coupon.iface";
import type { ICustomerRepository } from "@/modules/customers/domain/customers.iface";
import type { Order } from "../domain/order.entity";
import type { Coupon } from "@/modules/coupons/domain/coupon.entity";
import { NotFoundError } from "../../../shared/presentation/errors";
import { MarkAsReadyUseCase } from "@/modules/drivers/application/mark-as-ready.use-case";
import filehub from "@/shared/filehub";
import redis from "@/shared/redis";

describe("ChangeOrderStatusUseCase", () => {
  let useCase: ChangeOrderStatusUseCase;
  let mockOrderRepo: IOrderRepository;
  let mockProductRepo: IProductRepository;
  let mockCouponRepo: ICouponRepository;
  let mockCustomerRepo: ICustomerRepository;
  let mockMarkAsReadyUC: MarkAsReadyUseCase;
  let originalGetSignedPutUrl: typeof filehub.getSignedPutUrl;
  let originalSet: typeof redis.set;

  beforeEach(() => {
    useCase = new ChangeOrderStatusUseCase();
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
      findByIds: mock(() => Promise.resolve([])),
      existsByIds: mock(() => Promise.resolve(false)),
      create: mock(() => Promise.resolve({} as any)),
      update: mock(() => Promise.resolve({} as any)),
      updateStock: mock(() => Promise.resolve()),
      updateStockMany: mock(() => Promise.resolve()),
      delete: mock(() => Promise.resolve()),
    };
    mockCouponRepo = {
      findAll: mock(() => Promise.resolve([])),
      findById: mock(() => Promise.resolve(null)),
      findByName: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Coupon)),
      update: mock(() => Promise.resolve({} as Coupon)),
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
    mockMarkAsReadyUC = {
      execute: mock(() => Promise.resolve({ success: true })),
    } as any;
    originalGetSignedPutUrl = filehub.getSignedPutUrl;
    originalSet = redis.set;
    filehub.getSignedPutUrl = mock(() =>
      Promise.resolve({
        filename: "cancellation.jpg",
        signedUrl: "https://example.com/upload.jpg",
        expirationDate: new Date(),
      })
    ) as typeof filehub.getSignedPutUrl;
    redis.set = mock(() => Promise.resolve("OK")) as typeof redis.set;
  });

  afterEach(() => {
    filehub.getSignedPutUrl = originalGetSignedPutUrl;
    redis.set = originalSet;
  });

  it("should return existing order when status is unchanged", async () => {
    const mockOrder: Order = {
      id: "order-1",
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      orderItems: [],
      total: 100,
      status: "ready",
      createdAt: new Date().toISOString(),
    };

    mockOrderRepo.findById = mock(() => Promise.resolve(mockOrder));

    const result = await useCase.execute(
      { id: "order-1", status: "ready", cancellation: {} },
      mockOrderRepo,
      mockCustomerRepo,
      mockProductRepo,
      mockCouponRepo,
      mockMarkAsReadyUC
    );

    expect(result.order).toEqual(mockOrder);
    expect(mockOrderRepo.update).not.toHaveBeenCalled();
  });

  it("should throw NotFoundError when order not found", async () => {
    mockOrderRepo.findById = mock(() => Promise.resolve(null));

    await expect(
      useCase.execute(
        { id: "non-existent", status: "ready", cancellation: {} },
        mockOrderRepo,
        mockCustomerRepo,
        mockProductRepo,
        mockCouponRepo,
        mockMarkAsReadyUC
      )
    ).rejects.toThrow(NotFoundError);
  });

  it("should mark order as ready and call markAsReadyUC", async () => {
    const mockOrder: Order = {
      id: "order-1",
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      orderItems: [],
      total: 100,
      status: "processing",
      createdAt: new Date().toISOString(),
    };

    const updatedOrder: Order = {
      ...mockOrder,
      status: "ready",
    };

    mockOrderRepo.findById = mock(() => Promise.resolve(mockOrder));
    mockOrderRepo.update = mock(() => Promise.resolve(updatedOrder));

    const result = await useCase.execute(
      { id: "order-1", status: "ready", cancellation: {} },
      mockOrderRepo,
      mockCustomerRepo,
      mockProductRepo,
      mockCouponRepo,
      mockMarkAsReadyUC
    );

    expect(result.order.status).toBe("ready");
    expect(mockMarkAsReadyUC.execute).toHaveBeenCalledWith("order-1", mockOrderRepo);
    expect(mockOrderRepo.update).toHaveBeenCalledWith("order-1", {
      status: "ready",
      deliveredAt: undefined,
    });
  });

  it("should handle delivered status and update customer stats", async () => {
    const mockOrder: Order = {
      id: "order-1",
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      orderItems: [],
      total: 100,
      status: "out_for_delivery",
      pointsEarned: 10,
      createdAt: new Date().toISOString(),
    };

    const updatedOrder: Order = {
      ...mockOrder,
      status: "delivered",
      deliveredAt: new Date().toISOString(),
    };

    mockOrderRepo.findById = mock(() => Promise.resolve(mockOrder));
    mockOrderRepo.update = mock(() => Promise.resolve(updatedOrder));

    const result = await useCase.execute(
      { id: "order-1", status: "delivered", cancellation: {} },
      mockOrderRepo,
      mockCustomerRepo,
      mockProductRepo,
      mockCouponRepo,
      mockMarkAsReadyUC
    );

    expect(result.order.status).toBe("delivered");
    expect(mockCustomerRepo.update).toHaveBeenCalledWith("1234567890", {
      pointsDelta: 10,
      totalSpentDelta: 100,
      totalOrdersDelta: 1,
    });
    expect(mockOrderRepo.update).toHaveBeenCalledWith("order-1", {
      status: "delivered",
      deliveredAt: expect.any(Date),
    });
  });

  it("should handle cancelled status for pending order and restore stock", async () => {
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
      status: "pending",
      pointsUsed: 20,
      couponId: "coupon-1",
      createdAt: new Date().toISOString(),
    };

    const mockCoupon: Coupon = {
      id: "coupon-1",
      name: "TEST10",
      value: 10,
      remainingUses: 5,
    };

    const updatedOrder: Order = {
      ...mockOrder,
      status: "cancelled",
    };

    mockOrderRepo.findById = mock(() => Promise.resolve(mockOrder));
    mockCouponRepo.findById = mock(() => Promise.resolve(mockCoupon));
    mockOrderRepo.update = mock(() => Promise.resolve(updatedOrder));

    const result = await useCase.execute(
      { id: "order-1", status: "cancelled", cancellation: { reason: "Out of stock" } },
      mockOrderRepo,
      mockCustomerRepo,
      mockProductRepo,
      mockCouponRepo,
      mockMarkAsReadyUC
    );

    expect(result.order.status).toBe("cancelled");
    expect(mockProductRepo.updateStockMany).toHaveBeenCalledWith([
      { id: "prod-1", delta: 2 },
    ]);
    expect(mockCouponRepo.findById).toHaveBeenCalledWith("coupon-1");
    expect(mockCouponRepo.update).toHaveBeenCalledWith("coupon-1", {
      remainingUses: 6,
    });
    expect(mockCustomerRepo.update).toHaveBeenCalledWith("1234567890", {
      pointsDelta: 20,
    });
    expect(mockOrderRepo.saveCancellation).toHaveBeenCalledWith({
      orderId: "order-1",
      reason: "Out of stock",
      cancelledBy: "inventory",
    });
  });

  it("should handle cancelled status for delivered order and revert customer stats", async () => {
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
      status: "delivered",
      pointsEarned: 10,
      pointsUsed: 20,
      createdAt: new Date().toISOString(),
    };

    const updatedOrder: Order = {
      ...mockOrder,
      status: "cancelled",
    };

    mockOrderRepo.findById = mock(() => Promise.resolve(mockOrder));
    mockOrderRepo.update = mock(() => Promise.resolve(updatedOrder));

    const result = await useCase.execute(
      { id: "order-1", status: "cancelled", cancellation: { reason: "Refund" } },
      mockOrderRepo,
      mockCustomerRepo,
      mockProductRepo,
      mockCouponRepo,
      mockMarkAsReadyUC
    );

    expect(result.order.status).toBe("cancelled");
    // When order was delivered, only revert delivered stats (not stock/coupon/points)
    // because wasReadyOrBeyond is false for "delivered" status
    expect(mockProductRepo.updateStockMany).not.toHaveBeenCalled();
    expect(mockCustomerRepo.update).toHaveBeenCalledWith("1234567890", {
      pointsDelta: -10, // Revert earned points
      totalSpentDelta: -100, // Revert total spent
      totalOrdersDelta: -1, // Revert total orders
    });
  });

  it("should handle cancellation with file attachment", async () => {
    const mockOrder: Order = {
      id: "order-1",
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      orderItems: [],
      total: 100,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const updatedOrder: Order = {
      ...mockOrder,
      status: "cancelled",
    };

    const mockCancellation = {
      id: "cancellation-1",
      orderId: "order-1",
      reason: "Damaged",
      cancelledBy: "inventory" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockOrderRepo.findById = mock(() => Promise.resolve(mockOrder));
    mockOrderRepo.saveCancellation = mock(() =>
      Promise.resolve(mockCancellation as any)
    );
    mockOrderRepo.update = mock(() => Promise.resolve(updatedOrder));

    const result = await useCase.execute(
      {
        id: "order-1",
        status: "cancelled",
        cancellation: { reason: "Damaged", attachWithFileExtension: ".jpg" },
      },
      mockOrderRepo,
      mockCustomerRepo,
      mockProductRepo,
      mockCouponRepo,
      mockMarkAsReadyUC
    );

    expect(result.cancellationPutUrl).toBe("https://example.com/upload.jpg");
    expect(filehub.getSignedPutUrl).toHaveBeenCalledWith(3600 * 24 * 7, ".jpg");
    expect(redis.set).toHaveBeenCalledWith(
      "filehub:cancellation.jpg",
      "cancellation-1",
      "EX",
      3600 * 24 * 7
    );
  });

  it("should handle cancelled status without coupon", async () => {
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
          quantity: 1,
          price: 50,
          productName: "Product 1",
          productStock: 100,
          productQuantityType: "count",
        },
      ],
      total: 100,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const updatedOrder: Order = {
      ...mockOrder,
      status: "cancelled",
    };

    mockOrderRepo.findById = mock(() => Promise.resolve(mockOrder));
    mockOrderRepo.update = mock(() => Promise.resolve(updatedOrder));

    await useCase.execute(
      { id: "order-1", status: "cancelled", cancellation: {} },
      mockOrderRepo,
      mockCustomerRepo,
      mockProductRepo,
      mockCouponRepo,
      mockMarkAsReadyUC
    );

    expect(mockProductRepo.updateStockMany).toHaveBeenCalled();
    expect(mockCouponRepo.findById).not.toHaveBeenCalled();
  });
});

