import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import type { Coupon } from "@/modules/coupons/domain/coupon.entity";
import type { ICouponRepository } from "@/modules/coupons/domain/coupon.iface";
import type { UpsertCustomerUseCase } from "@/modules/customers/application/upsert-customer.use-case";
import type { StoreSettings } from "@/modules/settings/domain/settings.entity";
import type { ISettingsRepository } from "@/modules/settings/domain/settings.iface";
import filehub from "@/shared/filehub";
import redis from "@/shared/redis";
import { inventoryIO } from "@/socket.io";
import { BadRequestError } from "../../../shared/presentation/errors";
import type { Customer } from "../../customers/domain/customer.entity";
import type { ICustomerRepository } from "../../customers/domain/customers.iface";
import type { Product } from "../../products/domain/product.entity";
import type { IProductRepository } from "../../products/domain/products.iface";
import type { Order, OrderCancellation } from "../domain/order.entity";
import type { IOrderRepository } from "../domain/orders.iface";
import { CreateOrderUseCase } from "./create-order.use-case";

describe("CreateOrderUseCase", () => {
	let useCase: CreateOrderUseCase;
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
					description: "Description",
					stock: 100,
					quantityType: "count",
				} as Product),
			),
			findByIds: mock(() =>
				Promise.resolve([
					{
						id: "product-1",
						name: "Product 1",
						price: 10,
						category: "cat-1",
						description: "Description",
						stock: 100,
						quantityType: "count",
					} as Product,
				]),
			),
			existsByIds: mock(() => Promise.resolve(true)),
			create: mock(() => Promise.resolve({} as Product)),
			update: mock(() => Promise.resolve({} as Product)),
			updateStock: mock(() => Promise.resolve()),
			updateStockMany: mock(() => Promise.resolve()),
			delete: mock(() => Promise.resolve()),
		};

		mockCustomerRepo = {
			findByPhone: mock(() => Promise.resolve(null)),
			create: mock(() =>
				Promise.resolve({
					phone: "1234567890",
					password: "hash",
					name: "John Doe",
					address: "123 Main St",
					points: 0,
					totalSpent: null,
					totalOrders: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				} as Customer),
			),
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
					points: 0,
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

	it("should create order successfully", async () => {
		const orderData = {
			customerName: "John Doe",
			phone: "1234567890",
			address: "123 Main St",
			items: [{ id: "product-1", quantity: 2 }],
			paymentMethod: "cod" as const,
			password: "password123",
		};

		mockOrderRepo.findById = mock(() =>
			Promise.resolve({
				id: "new-id",
				customerName: "John Doe",
				phone: "1234567890",
				address: "123 Main St",
				orderItems: [],
				total: 100,
				status: "pending",
				createdAt: new Date().toISOString(),
			} as Order),
		);

		const result = await useCase.execute(
			orderData,
			mockOrderRepo,
			mockProductRepo,
			mockUpsertCustomerUC,
			mockSettingsRepo,
			mockCustomerRepo,
			mockCouponRepo,
		);

		expect(result.order.id).toBe("new-id");
		expect(result.verificationCode).toBeDefined();
		expect(mockOrderRepo.create).toHaveBeenCalled();
		expect(mockProductRepo.findByIds).toHaveBeenCalledWith(["product-1"]);
		expect(mockProductRepo.updateStockMany).toHaveBeenCalled();
		expect(mockUpsertCustomerUC.execute).toHaveBeenCalled();
		expect(mockSettingsRepo.find).toHaveBeenCalled();
	});

	it("should throw BadRequestError for empty items array", async () => {
		const orderData = {
			customerName: "John Doe",
			phone: "1234567890",
			address: "123 Main St",
			items: [],
			paymentMethod: "cod" as const,
			password: "password123",
		};

		await expect(
			useCase.execute(
				orderData,
				mockOrderRepo,
				mockProductRepo,
				mockUpsertCustomerUC,
				mockSettingsRepo,
				mockCustomerRepo,
				mockCouponRepo,
			),
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
			password: "password123",
		};

		await expect(
			useCase.execute(
				orderData,
				mockOrderRepo,
				mockProductRepo,
				mockUpsertCustomerUC,
				mockSettingsRepo,
				mockCustomerRepo,
				mockCouponRepo,
			),
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
			password: "password123",
		};

		await expect(
			useCase.execute(
				orderData,
				mockOrderRepo,
				mockProductRepo,
				mockUpsertCustomerUC,
				mockSettingsRepo,
				mockCustomerRepo,
				mockCouponRepo,
			),
		).rejects.toThrow(BadRequestError);
		expect(mockOrderRepo.create).not.toHaveBeenCalled();
	});

	it("should throw BadRequestError for insufficient stock", async () => {
		mockProductRepo.findByIds = mock(() =>
			Promise.resolve([
				{
					id: "product-1",
					name: "Product 1",
					price: 10,
					category: "cat-1",
					description: "Description",
					stock: 1, // Only 1 in stock
					quantityType: "count",
				} as Product,
			]),
		);

		const orderData = {
			customerName: "John Doe",
			phone: "1234567890",
			address: "123 Main St",
			items: [{ id: "product-1", quantity: 2 }], // Requesting 2
			paymentMethod: "cod" as const,
			password: "password123",
		};

		await expect(
			useCase.execute(
				orderData,
				mockOrderRepo,
				mockProductRepo,
				mockUpsertCustomerUC,
				mockSettingsRepo,
				mockCustomerRepo,
				mockCouponRepo,
			),
		).rejects.toThrow(BadRequestError);
		expect(mockOrderRepo.create).not.toHaveBeenCalled();
	});

	it("should throw BadRequestError for non-existent product", async () => {
		mockProductRepo.findByIds = mock(() => Promise.resolve([]));

		const orderData = {
			customerName: "John Doe",
			phone: "1234567890",
			address: "123 Main St",
			items: [{ id: "non-existent", quantity: 2 }],
			paymentMethod: "cod" as const,
			password: "password123",
		};

		await expect(
			useCase.execute(
				orderData,
				mockOrderRepo,
				mockProductRepo,
				mockUpsertCustomerUC,
				mockSettingsRepo,
				mockCustomerRepo,
				mockCouponRepo,
			),
		).rejects.toThrow(BadRequestError);
		expect(mockOrderRepo.create).not.toHaveBeenCalled();
	});

	it("should update existing customer instead of creating", async () => {
		mockUpsertCustomerUC.execute = mock(() =>
			Promise.resolve({
				phone: "1234567890",
				name: "John Doe",
				address: "123 Main St",
				points: 50,
			} as Customer),
		);

		mockOrderRepo.findById = mock(() =>
			Promise.resolve({
				id: "new-id",
				customerName: "John Doe",
				phone: "1234567890",
				address: "123 Main St",
				orderItems: [],
				total: 100,
				status: "pending",
				createdAt: new Date().toISOString(),
			} as Order),
		);

		const orderData = {
			customerName: "John Doe",
			phone: "1234567890",
			address: "123 Main St",
			items: [{ id: "product-1", quantity: 2 }],
			paymentMethod: "cod" as const,
			password: "password123",
		};

		await useCase.execute(
			orderData,
			mockOrderRepo,
			mockProductRepo,
			mockUpsertCustomerUC,
			mockSettingsRepo,
			mockCustomerRepo,
			mockCouponRepo,
		);

		expect(mockUpsertCustomerUC.execute).toHaveBeenCalled();
		expect(mockOrderRepo.create).toHaveBeenCalled();
	});

	it("should allow optional fields", async () => {
		mockUpsertCustomerUC.execute = mock(() =>
			Promise.resolve({
				phone: "1234567890",
				name: "John Doe",
				address: "123 Main St",
				points: 200, // Enough points
			} as Customer),
		);

		const createdOrder: Order = {
			id: "new-id",
			customerName: "John Doe",
			phone: "1234567890",
			address: "123 Main St",
			orderItems: [],
			total: 100,
			status: "pending",
			pointsUsed: 100,
			createdAt: new Date().toISOString(),
		};

		mockOrderRepo.create = mock(() => Promise.resolve(createdOrder));
		mockOrderRepo.findById = mock(() => Promise.resolve(createdOrder));

		const orderData = {
			customerName: "John Doe",
			phone: "1234567890",
			address: "123 Main St",
			items: [{ id: "product-1", quantity: 2 }],
			paymentMethod: "cod" as const,
			password: "password123",
			pointsToUse: 100,
		};

		await useCase.execute(
			orderData,
			mockOrderRepo,
			mockProductRepo,
			mockUpsertCustomerUC,
			mockSettingsRepo,
			mockCustomerRepo,
			mockCouponRepo,
		);

		expect(mockOrderRepo.create).toHaveBeenCalled();
		expect(mockUpsertCustomerUC.execute).toHaveBeenCalled();
		// handlePendingStatus is called after order creation, which updates customer points
		expect(mockCustomerRepo.update).toHaveBeenCalledWith("1234567890", {
			pointsDelta: -100,
		});
		expect(mockSettingsRepo.find).toHaveBeenCalled();
	});
});
