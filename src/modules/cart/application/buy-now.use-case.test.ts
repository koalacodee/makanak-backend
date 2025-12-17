import { describe, it, expect, beforeEach, mock } from "bun:test";
import { BuyNowUseCase } from "./buy-now.use-case";
import type { ICartRepository } from "../domain/cart.iface";
import type { IOrderRepository } from "../../orders/domain/orders.iface";
import type { IProductRepository } from "../../products/domain/products.iface";
import type { ICustomerRepository } from "../../customers/domain/customers.iface";
import type { Cart, CartItemEntity } from "../domain/cart.entity";
import type { Order } from "../../orders/domain/order.entity";
import type { Product } from "../../products/domain/product.entity";
import type { Customer } from "../../customers/domain/customer.entity";
import {
  BadRequestError,
  NotFoundError,
} from "../../../shared/presentation/errors";

describe("BuyNowUseCase", () => {
  let useCase: BuyNowUseCase;
  let mockCartRepo: ICartRepository;
  let mockOrderRepo: IOrderRepository;
  let mockProductRepo: IProductRepository;
  let mockCustomerRepo: ICustomerRepository;

  beforeEach(() => {
    useCase = new BuyNowUseCase();
    mockCartRepo = {
      findByCustomerPhone: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Cart)),
      addItem: mock(() => Promise.resolve({} as CartItemEntity)),
      updateItemQuantity: mock(() => Promise.resolve({} as CartItemEntity)),
      removeItem: mock(() => Promise.resolve()),
      clearCart: mock(() => Promise.resolve()),
      findItemByCartAndProduct: mock(() => Promise.resolve(null)),
      findItemById: mock(() => Promise.resolve(null)),
    };
    mockOrderRepo = {
      findAll: mock(() => Promise.resolve({ data: [], total: 0 })),
      findById: mock(() => Promise.resolve(null)),
      create: mock(() =>
        Promise.resolve({
          id: "order-1",
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
          image: "https://example.com/img1.jpg",
          description: "Description 1",
          stock: 100,
        } as Product)
      ),
      create: mock(() => Promise.resolve({} as Product)),
      update: mock(() => Promise.resolve({} as Product)),
      delete: mock(() => Promise.resolve()),
    };
    mockCustomerRepo = {
      findByPhone: mock(() =>
        Promise.resolve({
          phone: "1234567890",
          name: "John Doe",
          address: "123 Main St",
          points: 100,
          totalSpent: "0",
          totalOrders: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Customer)
      ),
      create: mock(() => Promise.resolve({} as Customer)),
      update: mock(() => Promise.resolve({} as Customer)),
      upsert: mock(() => Promise.resolve({} as Customer)),
      getPointsInfo: mock(() => Promise.resolve(null)),
    };
  });

  it("should convert cart to order successfully", async () => {
    const mockCart: Cart = {
      id: "cart-1",
      customerPhone: "1234567890",
      items: [
        {
          id: "item-1",
          productId: "product-1",
          quantity: 2,
          product: {
            id: "product-1",
            name: "Product 1",
            price: 10,
            unit: "kg",
            categoryId: "cat-1",
            image: "https://example.com/img1.jpg",
            description: "Description 1",
            stock: 100,
            originalPrice: null,
          },
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockOrder: Order = {
      id: "order-1",
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      items: [
        {
          id: "product-1",
          name: "Product 1",
          price: 10,
          unit: "kg",
          category: "cat-1",
          image: "https://example.com/img1.jpg",
          description: "Description 1",
          stock: 100,
          originalPrice: null,
          quantity: 2,
        },
      ],
      subtotal: "20.00",
      deliveryFee: "5.00",
      total: "25.00",
      status: "pending",
      createdAt: new Date(),
    };

    mockCartRepo.findByCustomerPhone = mock(() => Promise.resolve(mockCart));
    mockOrderRepo.create = mock(() => Promise.resolve(mockOrder));
    mockCartRepo.clearCart = mock(() => Promise.resolve());

    const result = await useCase.execute(
      "1234567890",
      {
        customerName: "John Doe",
        address: "123 Main St",
        subtotal: 20,
        deliveryFee: 5,
        paymentMethod: "cod",
      },
      mockCartRepo,
      mockOrderRepo,
      mockProductRepo,
      mockCustomerRepo
    );

    expect(result).toEqual(mockOrder);
    expect(mockCartRepo.clearCart).toHaveBeenCalledWith("cart-1");
  });

  it("should calculate subtotal if not provided", async () => {
    const mockCart: Cart = {
      id: "cart-1",
      customerPhone: "1234567890",
      items: [
        {
          id: "item-1",
          productId: "product-1",
          quantity: 2,
          product: {
            id: "product-1",
            name: "Product 1",
            price: 10,
            unit: "kg",
            categoryId: "cat-1",
            image: "https://example.com/img1.jpg",
            description: "Description 1",
            stock: 100,
            originalPrice: null,
          },
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockOrder: Order = {
      id: "order-1",
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      items: [],
      total: "20.00",
      status: "pending",
      createdAt: new Date(),
    };

    mockCartRepo.findByCustomerPhone = mock(() => Promise.resolve(mockCart));
    mockOrderRepo.create = mock(() => Promise.resolve(mockOrder));
    mockCartRepo.clearCart = mock(() => Promise.resolve());

    await useCase.execute(
      "1234567890",
      {
        customerName: "John Doe",
        address: "123 Main St",
        paymentMethod: "cod",
      },
      mockCartRepo,
      mockOrderRepo,
      mockProductRepo,
      mockCustomerRepo
    );

    // Verify create was called with calculated subtotal (2 * 10 = 20)
    expect(mockOrderRepo.create).toHaveBeenCalled();
    const createCall = (mockOrderRepo.create as any).mock.calls[0];
    expect(createCall[0].subtotal).toBe("20");
  });

  it("should throw NotFoundError if cart not found", async () => {
    mockCartRepo.findByCustomerPhone = mock(() => Promise.resolve(null));

    await expect(
      useCase.execute(
        "1234567890",
        {
          customerName: "John Doe",
          address: "123 Main St",
          paymentMethod: "cod",
        },
        mockCartRepo,
        mockOrderRepo,
        mockProductRepo,
        mockCustomerRepo
      )
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BadRequestError if cart is empty", async () => {
    const mockCart: Cart = {
      id: "cart-1",
      customerPhone: "1234567890",
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockCartRepo.findByCustomerPhone = mock(() => Promise.resolve(mockCart));

    await expect(
      useCase.execute(
        "1234567890",
        {
          customerName: "John Doe",
          address: "123 Main St",
          paymentMethod: "cod",
        },
        mockCartRepo,
        mockOrderRepo,
        mockProductRepo,
        mockCustomerRepo
      )
    ).rejects.toThrow(BadRequestError);
  });
});
