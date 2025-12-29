import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import type { Coupon } from "@/modules/coupons/domain/coupon.entity";
import type { ICouponRepository } from "@/modules/coupons/domain/coupon.iface";
import type { UpsertCustomerUseCase } from "@/modules/customers/application/upsert-customer.use-case";
import type { StoreSettings } from "@/modules/settings/domain/settings.entity";
import type { ISettingsRepository } from "@/modules/settings/domain/settings.iface";
import filehub from "@/shared/filehub";
import redis from "@/shared/redis";
import { inventoryIO } from "@/socket.io";
import {
	BadRequestError,
	NotFoundError,
} from "../../../shared/presentation/errors";
import type { Customer } from "../../customers/domain/customer.entity";
import type { ICustomerRepository } from "../../customers/domain/customers.iface";
import type {
	Order,
	OrderCancellation,
} from "../../orders/domain/order.entity";
import type { IOrderRepository } from "../../orders/domain/orders.iface";
import type { Product } from "../../products/domain/product.entity";
import type { IProductRepository } from "../../products/domain/products.iface";
import type { Cart, CartItemEntity } from "../domain/cart.entity";
import type { ICartRepository } from "../domain/cart.iface";
import { BuyNowUseCase } from "./buy-now.use-case";

describe("BuyNowUseCase", () => {
	let useCase: BuyNowUseCase;
	let mockCartRepo: ICartRepository;
	let mockOrderRepo: IOrderRepository;
	let mockProductRepo: IProductRepository;
	let mockCustomerRepo: ICustomerRepository;
	let mockSettingsRepo: ISettingsRepository;
	let mockCouponRepo: ICouponRepository;
	let mockUpsertCustomerUC: UpsertCustomerUseCase;
	let originalGetSignedPutUrl: typeof filehub.getSignedPutUrl;
	let originalSet: typeof redis.set;
	let originalNotifyInventoryWithPendingOrder: typeof inventoryIO.notifyInventoryWithPendingOrder;

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
					orderItems: [],
					total: 100,
					status: "pending",
					createdAt: new Date().toISOString(),
				} as Order),
			),
			update: mock(() => Promise.resolve({} as Order)),
			getReadyOrdersForDriver: mock(() =>
				Promise.resolve({ orders: [], counts: [] }),
			),
			count: mock(() => Promise.resolve(0)),
			saveCancellation: mock(() => Promise.resolve({} as OrderCancellation)),
		};
		mockProductRepo = {
			findAll: mock(() => Promise.resolve({ data: [], total: 0 })),
			findById: mock(() =>
				Promise.resolve({
					id: "product-1",
					name: "Product 1",
					price: 10,
					category: "cat-1",
					description: "Description 1",
					stock: 100,
					quantityType: "count" as const,
				} as Product),
			),
			findByIds: mock(() =>
				Promise.resolve([
					{
						id: "product-1",
						name: "Product 1",
						price: 10,
						category: "cat-1",
						description: "Description 1",
						stock: 100,
						quantityType: "count" as const,
					} as Product,
				]),
			),
			existsByIds: mock(() => Promise.resolve(true)),
			create: mock(() => Promise.resolve({} as Product)),
			update: mock(() => Promise.resolve({} as Product)),
			delete: mock(() => Promise.resolve()),
			updateStock: mock(() => Promise.resolve()),
			updateStockMany: mock(() => Promise.resolve()),
		};
		mockCustomerRepo = {
			findByPhone: mock(() =>
				Promise.resolve({
					phone: "1234567890",
					password: "hash",
					name: "John Doe",
					address: "123 Main St",
					points: 100,
					totalSpent: null,
					totalOrders: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				} as Customer),
			),
			create: mock(() => Promise.resolve({} as Customer)),
			update: mock(() => Promise.resolve({} as Customer)),
			changePassword: mock(() => Promise.resolve({} as Customer)),
			upsert: mock(() => Promise.resolve({} as Customer)),
			getPointsInfo: mock(() => Promise.resolve(null)),
			findAll: mock(() => Promise.resolve([])),
		};
		mockSettingsRepo = {
			find: mock(() =>
				Promise.resolve({
					deliveryFee: 10,
					pointsSystem: {
						value: 10,
						redemptionValue: 0.1,
					},
				} as StoreSettings),
			),
			update: mock(() => Promise.resolve({} as StoreSettings)),
			create: mock(() => Promise.resolve({} as StoreSettings)),
		};
		mockCouponRepo = {
			findAll: mock(() => Promise.resolve([])),
			findById: mock(() => Promise.resolve(null)),
			findByName: mock(() => Promise.resolve(null)),
			create: mock(() => Promise.resolve({} as Coupon)),
			update: mock(() => Promise.resolve({} as Coupon)),
			delete: mock(() => Promise.resolve()),
		};
		mockUpsertCustomerUC = {
			execute: mock(() =>
				Promise.resolve({
					phone: "1234567890",
					name: "John Doe",
					address: "123 Main St",
					points: 100,
				} as Customer),
			),
		} as UpsertCustomerUseCase;
		originalGetSignedPutUrl = filehub.getSignedPutUrl;
		originalSet = redis.set;
		originalNotifyInventoryWithPendingOrder =
			inventoryIO.notifyInventoryWithPendingOrder;
		filehub.getSignedPutUrl = mock(() =>
			Promise.resolve({
				filename: "receipt.jpg",
				signedUrl: "https://example.com/upload.jpg",
				expirationDate: new Date(),
			}),
		) as typeof filehub.getSignedPutUrl;
		redis.set = mock(() => Promise.resolve("OK")) as typeof redis.set;
		inventoryIO.notifyInventoryWithPendingOrder = mock(
			() => {},
		) as typeof inventoryIO.notifyInventoryWithPendingOrder;
	});

	afterEach(() => {
		filehub.getSignedPutUrl = originalGetSignedPutUrl;
		redis.set = originalSet;
		inventoryIO.notifyInventoryWithPendingOrder =
			originalNotifyInventoryWithPendingOrder;
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

		const createdOrder: Order = {
			id: "order-1",
			customerName: "John Doe",
			phone: "1234567890",
			address: "123 Main St",
			orderItems: [
				{
					id: "item-1",
					orderId: "order-1",
					productId: "product-1",
					quantity: 2,
					price: 10,
					productName: "Product 1",
					productStock: 100,
					productQuantityType: "count",
				},
			],
			total: 100,
			status: "pending",
			createdAt: new Date().toISOString(),
		};

		mockCartRepo.findByCustomerPhone = mock(() => Promise.resolve(mockCart));
		mockOrderRepo.create = mock(() => Promise.resolve(createdOrder));
		mockOrderRepo.findById = mock(() => Promise.resolve(createdOrder));
		mockCartRepo.clearCart = mock(() => Promise.resolve());

		const result = await useCase.execute(
			"1234567890",
			{
				customerName: "John Doe",
				address: "123 Main St",
				subtotal: 20,
				deliveryFee: 5,
				paymentMethod: "cod",
				password: "password123",
			},
			mockCartRepo,
			mockOrderRepo,
			mockProductRepo,
			mockUpsertCustomerUC,
			mockSettingsRepo,
			mockCustomerRepo,
			mockCouponRepo,
		);

		expect(result.id).toBeDefined();
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

		mockCartRepo.findByCustomerPhone = mock(() => Promise.resolve(mockCart));
		mockOrderRepo.findById = mock(() =>
			Promise.resolve({
				id: "order-1",
				customerName: "John Doe",
				phone: "1234567890",
				address: "123 Main St",
				orderItems: [],
				total: 100,
				status: "pending",
				createdAt: new Date().toISOString(),
			} as Order),
		);
		mockCartRepo.clearCart = mock(() => Promise.resolve());

		await useCase.execute(
			"1234567890",
			{
				customerName: "John Doe",
				address: "123 Main St",
				paymentMethod: "cod",
				password: "password123",
			},
			mockCartRepo,
			mockOrderRepo,
			mockProductRepo,
			mockUpsertCustomerUC,
			mockSettingsRepo,
			mockCustomerRepo,
			mockCouponRepo,
		);

		// Verify create was called
		expect(mockOrderRepo.create).toHaveBeenCalled();
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
					password: "password123",
				},
				mockCartRepo,
				mockOrderRepo,
				mockProductRepo,
				mockUpsertCustomerUC,
				mockSettingsRepo,
				mockCustomerRepo,
				mockCouponRepo,
			),
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
					password: "password123",
				},
				mockCartRepo,
				mockOrderRepo,
				mockProductRepo,
				mockUpsertCustomerUC,
				mockSettingsRepo,
				mockCustomerRepo,
				mockCouponRepo,
			),
		).rejects.toThrow(BadRequestError);
	});
});
