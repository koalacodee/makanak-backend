import { describe, it, expect, beforeEach, mock } from "bun:test";
import { UpdateOrderUseCase } from "./update-order.use-case";
import type { IOrderRepository } from "../domain/orders.iface";
import type { ICustomerRepository } from "../../customers/domain/customers.iface";
import type { ISettingsRepository } from "../../settings/domain/settings.iface";
import type { IProductRepository } from "../../products/domain/products.iface";
import type { Order } from "../domain/order.entity";
import type { Customer } from "../../customers/domain/customer.entity";
import type { Product } from "../../products/domain/product.entity";
import { NotFoundError } from "../../../shared/presentation/errors";

describe("UpdateOrderUseCase", () => {
  let useCase: UpdateOrderUseCase;
  let mockOrderRepo: IOrderRepository;
  let mockCustomerRepo: ICustomerRepository;
  let mockSettingsRepo: ISettingsRepository;
  let mockProductRepo: IProductRepository;

  beforeEach(() => {
    useCase = new UpdateOrderUseCase();
    mockOrderRepo = {
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
        } as Order)
      ),
    };

    mockCustomerRepo = {
      findByPhone: mock(() =>
        Promise.resolve({
          phone: "1234567890",
          name: "John Doe",
          address: "123 Main St",
          points: 100,
          totalSpent: "500.00",
          totalOrders: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Customer)
      ),
      create: mock(() => Promise.resolve({} as Customer)),
      update: mock(() => Promise.resolve({} as Customer)),
      upsert: mock(() => Promise.resolve({} as Customer)),
      getPointsInfo: mock(() => Promise.resolve(null)),
    };

    mockSettingsRepo = {
      find: mock(() =>
        Promise.resolve({
          id: "settings-1",
          pointsSystem: {
            active: true,
            value: 10,
            redemptionValue: 0.1,
          },
          deliveryFee: "5.00",
          announcement: { active: false, message: "" },
          socialMedia: {},
          paymentInfo: {},
          promo: { isActive: false },
          content: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ),
      create: mock(() => Promise.resolve({} as any)),
      update: mock(() => Promise.resolve({} as any)),
    };

    mockProductRepo = {
      findAll: mock(() => Promise.resolve({ data: [], total: 0 })),
      findById: mock(() =>
        Promise.resolve({
          id: "product-1",
          name: "Product 1",
          price: "10.00",
          unit: "kg",
          category: "cat-1",
          image: "https://...",
          description: "Description",
          stock: 10,
        } as Product)
      ),
      create: mock(() => Promise.resolve({} as Product)),
      update: mock(() => Promise.resolve({} as Product)),
      delete: mock(() => Promise.resolve()),
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

    mockOrderRepo.findById = mock(() => Promise.resolve(existingOrder));

    const updateData = { status: "processing" as const };
    const result = await useCase.execute(
      "1",
      updateData,
      mockOrderRepo,
      mockCustomerRepo,
      mockSettingsRepo,
      mockProductRepo
    );

    expect(result.status).toBe("processing");
    expect(mockOrderRepo.findById).toHaveBeenCalledWith("1");
    expect(mockOrderRepo.update).toHaveBeenCalledWith("1", updateData);
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

    mockOrderRepo.findById = mock(() => Promise.resolve(existingOrder));

    const updateData = { driverId: "driver-1" };
    await useCase.execute(
      "1",
      updateData,
      mockOrderRepo,
      mockCustomerRepo,
      mockSettingsRepo,
      mockProductRepo
    );

    expect(mockOrderRepo.update).toHaveBeenCalledWith("1", updateData);
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

    mockOrderRepo.findById = mock(() => Promise.resolve(existingOrder));

    const updateData = { receiptImage: "base64encodedimage" };
    await useCase.execute(
      "1",
      updateData,
      mockOrderRepo,
      mockCustomerRepo,
      mockSettingsRepo,
      mockProductRepo
    );

    expect(mockOrderRepo.update).toHaveBeenCalledWith("1", updateData);
  });

  it("should calculate and update points when order is delivered", async () => {
    const existingOrder: Order = {
      id: "1",
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      items: [],
      total: "100.00",
      status: "out_for_delivery", // Valid transition to "delivered"
      pointsUsed: 50,
      createdAt: new Date(),
    };

    const updatedOrder: Order = {
      ...existingOrder,
      status: "delivered",
    };

    mockOrderRepo.findById = mock(() => Promise.resolve(existingOrder));
    mockOrderRepo.update = mock(() => Promise.resolve(updatedOrder));

    const updateData = { status: "delivered" as const };
    await useCase.execute(
      "1",
      updateData,
      mockOrderRepo,
      mockCustomerRepo,
      mockSettingsRepo,
      mockProductRepo
    );

    expect(mockOrderRepo.update).toHaveBeenCalledWith("1", updateData);
    expect(mockSettingsRepo.find).toHaveBeenCalled();
    expect(mockCustomerRepo.findByPhone).toHaveBeenCalledWith("1234567890");
    expect(mockCustomerRepo.update).toHaveBeenCalled();
    expect(mockCustomerRepo.upsert).toHaveBeenCalled();
  });

  it("should not update points if points system is not active", async () => {
    mockSettingsRepo.find = mock(() =>
      Promise.resolve({
        id: "settings-1",
        pointsSystem: {
          active: false, // Points system inactive
          value: 10,
          redemptionValue: 0.1,
        },
        deliveryFee: "5.00",
        announcement: { active: false, message: "" },
        socialMedia: {},
        paymentInfo: {},
        promo: { isActive: false },
        content: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );

    const existingOrder: Order = {
      id: "1",
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      items: [],
      total: "100.00",
      status: "out_for_delivery", // Valid transition to "delivered"
      createdAt: new Date(),
    };

    const updatedOrder: Order = {
      ...existingOrder,
      status: "delivered",
    };

    mockOrderRepo.findById = mock(() => Promise.resolve(existingOrder));
    mockOrderRepo.update = mock(() => Promise.resolve(updatedOrder));

    const updateData = { status: "delivered" as const };
    await useCase.execute(
      "1",
      updateData,
      mockOrderRepo,
      mockCustomerRepo,
      mockSettingsRepo,
      mockProductRepo
    );

    expect(mockCustomerRepo.update).not.toHaveBeenCalled();
  });

  it("should throw NotFoundError when order not found", async () => {
    mockOrderRepo.findById = mock(() => Promise.resolve(null));

    await expect(
      useCase.execute(
        "non-existent",
        { status: "processing" },
        mockOrderRepo,
        mockCustomerRepo,
        mockSettingsRepo,
        mockProductRepo
      )
    ).rejects.toThrow(NotFoundError);
    expect(mockOrderRepo.update).not.toHaveBeenCalled();
  });
});
