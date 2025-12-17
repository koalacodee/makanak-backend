import { describe, it, expect, beforeEach, mock } from "bun:test";
import { CreateOrderUseCase } from "./create-order.use-case";
import type { IOrderRepository } from "../domain/orders.iface";
import type { IProductRepository } from "../../products/domain/products.iface";
import type { ICustomerRepository } from "../../customers/domain/customers.iface";
import type { Order } from "../domain/order.entity";
import type { Product } from "../../products/domain/product.entity";
import type { Customer } from "../../customers/domain/customer.entity";
import { BadRequestError } from "../../../shared/presentation/errors";

describe("CreateOrderUseCase", () => {
  let useCase: CreateOrderUseCase;
  let mockOrderRepo: IOrderRepository;
  let mockProductRepo: IProductRepository;
  let mockCustomerRepo: ICustomerRepository;

  beforeEach(() => {
    useCase = new CreateOrderUseCase();
    mockOrderRepo = {
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
        } as Order)
      ),
      update: mock(() => Promise.resolve({} as Order)),
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
          stock: 100,
        } as Product)
      ),
      create: mock(() => Promise.resolve({} as Product)),
      update: mock(() => Promise.resolve({} as Product)),
      delete: mock(() => Promise.resolve()),
    };

    mockCustomerRepo = {
      findByPhone: mock(() => Promise.resolve(null)),
      create: mock(() =>
        Promise.resolve({
          phone: "1234567890",
          name: "John Doe",
          address: "123 Main St",
          points: 0,
          totalSpent: "0",
          totalOrders: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Customer)
      ),
      update: mock(() => Promise.resolve({} as Customer)),
      upsert: mock(() => Promise.resolve({} as Customer)),
      getPointsInfo: mock(() => Promise.resolve(null)),
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

    const result = await useCase.execute(
      orderData,
      mockOrderRepo,
      mockProductRepo,
      mockCustomerRepo
    );

    expect(result.id).toBe("new-id");
    expect(mockOrderRepo.create).toHaveBeenCalled();
    expect(mockProductRepo.findById).toHaveBeenCalledWith("product-1");
    expect(mockProductRepo.update).toHaveBeenCalled();
    expect(mockCustomerRepo.create).toHaveBeenCalled();
  });

  it("should throw BadRequestError for empty items array", async () => {
    const orderData = {
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      items: [],
      paymentMethod: "cod" as const,
    };

    await expect(
      useCase.execute(
        orderData,
        mockOrderRepo,
        mockProductRepo,
        mockCustomerRepo
      )
    ).rejects.toThrow(BadRequestError);
    expect(mockOrderRepo.create).not.toHaveBeenCalled();
  });

  it("should throw BadRequestError for zero quantity", async () => {
    const orderData = {
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      items: [{ id: "product-1", quantity: 0 }],
      paymentMethod: "cod" as const,
    };

    await expect(
      useCase.execute(
        orderData,
        mockOrderRepo,
        mockProductRepo,
        mockCustomerRepo
      )
    ).rejects.toThrow(BadRequestError);
    expect(mockOrderRepo.create).not.toHaveBeenCalled();
  });

  it("should throw BadRequestError for negative quantity", async () => {
    const orderData = {
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      items: [{ id: "product-1", quantity: -1 }],
      paymentMethod: "cod" as const,
    };

    await expect(
      useCase.execute(
        orderData,
        mockOrderRepo,
        mockProductRepo,
        mockCustomerRepo
      )
    ).rejects.toThrow(BadRequestError);
    expect(mockOrderRepo.create).not.toHaveBeenCalled();
  });

  it("should throw BadRequestError for insufficient stock", async () => {
    mockProductRepo.findById = mock(() =>
      Promise.resolve({
        id: "product-1",
        name: "Product 1",
        price: "10.00",
        unit: "kg",
        category: "cat-1",
        image: "https://...",
        description: "Description",
        stock: 1, // Only 1 in stock
      } as Product)
    );

    const orderData = {
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      items: [{ id: "product-1", quantity: 2 }], // Requesting 2
      paymentMethod: "cod" as const,
    };

    await expect(
      useCase.execute(
        orderData,
        mockOrderRepo,
        mockProductRepo,
        mockCustomerRepo
      )
    ).rejects.toThrow(BadRequestError);
    expect(mockOrderRepo.create).not.toHaveBeenCalled();
  });

  it("should throw BadRequestError for non-existent product", async () => {
    mockProductRepo.findById = mock(() => Promise.resolve(null));

    const orderData = {
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      items: [{ id: "non-existent", quantity: 2 }],
      paymentMethod: "cod" as const,
    };

    await expect(
      useCase.execute(
        orderData,
        mockOrderRepo,
        mockProductRepo,
        mockCustomerRepo
      )
    ).rejects.toThrow(BadRequestError);
    expect(mockOrderRepo.create).not.toHaveBeenCalled();
  });

  it("should update existing customer instead of creating", async () => {
    mockCustomerRepo.findByPhone = mock(() =>
      Promise.resolve({
        phone: "1234567890",
        name: "Jane Doe",
        address: "456 Oak Ave",
        points: 50,
        totalSpent: "200.00",
        totalOrders: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Customer)
    );

    const orderData = {
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      items: [{ id: "product-1", quantity: 2 }],
      paymentMethod: "cod" as const,
    };

    await useCase.execute(
      orderData,
      mockOrderRepo,
      mockProductRepo,
      mockCustomerRepo
    );

    expect(mockCustomerRepo.findByPhone).toHaveBeenCalledWith("1234567890");
    expect(mockCustomerRepo.update).toHaveBeenCalled();
    expect(mockCustomerRepo.create).not.toHaveBeenCalled();
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

    await useCase.execute(
      orderData,
      mockOrderRepo,
      mockProductRepo,
      mockCustomerRepo
    );

    expect(mockOrderRepo.create).toHaveBeenCalled();
  });
});
