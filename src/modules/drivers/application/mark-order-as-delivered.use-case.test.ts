import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import type { Coupon } from "@/modules/coupons/domain/coupon.entity";
import type { Customer } from "@/modules/customers/domain/customer.entity";
import type { Product } from "@/modules/products/domain/product.entity";
import redis from "@/shared/redis";
import {
	BadRequestError,
	ForbiddenError,
	NotFoundError,
	TooManyRequestsError,
	UnauthorizedError,
} from "../../../shared/presentation/errors";
import type { ICouponRepository } from "../../coupons/domain/coupon.iface";
import type { ICustomerRepository } from "../../customers/domain/customers.iface";
import type { ChangeOrderStatusUseCase } from "../../orders/application/change-order-status.use-case";
import type {
	Order,
	OrderCancellation,
} from "../../orders/domain/order.entity";
import type { IOrderRepository } from "../../orders/domain/orders.iface";
import type { IProductRepository } from "../../products/domain/products.iface";
import type { MarkAsReadyUseCase } from "./mark-as-ready.use-case";
import { MarkOrderAsDeliveredUseCase } from "./mark-order-as-delivered.use-case";

describe("MarkOrderAsDeliveredUseCase", () => {
	let useCase: MarkOrderAsDeliveredUseCase;
	let mockOrderRepo: IOrderRepository;
	let mockProductRepo: IProductRepository;
	let mockCouponRepo: ICouponRepository;
	let mockCustomerRepo: ICustomerRepository;
	let mockChangeOrderStatusUC: ChangeOrderStatusUseCase;
	let mockMarkAsReadyUC: MarkAsReadyUseCase;
	let originalGet: typeof redis.get;
	let originalSetex: typeof redis.setex;
	let originalSrem: typeof redis.srem;
	let originalRpush: typeof redis.rpush;
	let originalSend: typeof redis.send;

	beforeEach(() => {
		useCase = new MarkOrderAsDeliveredUseCase();
		mockOrderRepo = {
			findAll: mock(() => Promise.resolve({ data: [], total: 0 })),
			findById: mock(() => Promise.resolve(null)),
			create: mock(() => Promise.resolve({} as Order)),
			update: mock(() => Promise.resolve({} as Order)),
			getReadyOrdersForDriver: mock(() =>
				Promise.resolve({ orders: [], counts: [] }),
			),
			count: mock(() => Promise.resolve(0)),
			saveCancellation: mock(() => Promise.resolve({} as OrderCancellation)),
		};
		mockProductRepo = {
			findAll: mock(() => Promise.resolve({ data: [], total: 0 })),
			findById: mock(() => Promise.resolve(null)),
			create: mock(() => Promise.resolve({} as Product)),
			update: mock(() => Promise.resolve({} as Product)),
			delete: mock(() => Promise.resolve()),
			findByIds: mock(() => Promise.resolve([])),
			existsByIds: mock(() => Promise.resolve(false)),
			updateStock: mock(() => Promise.resolve()),
			updateStockMany: mock(() => Promise.resolve()),
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
			create: mock(() => Promise.resolve({} as Customer)),
			update: mock(() => Promise.resolve({} as Customer)),
			changePassword: mock(() => Promise.resolve({} as Customer)),
			upsert: mock(() => Promise.resolve({} as Customer)),
			getPointsInfo: mock(() => Promise.resolve(null)),
			findAll: mock(() => Promise.resolve([])),
		};
		mockChangeOrderStatusUC = {
			execute: mock(() => Promise.resolve({ order: {} as Order })),
		} as unknown as ChangeOrderStatusUseCase;
		mockMarkAsReadyUC = {} as MarkAsReadyUseCase;
		originalGet = redis.get;
		originalSetex = redis.setex;
		originalSrem = redis.srem;
		originalRpush = redis.rpush;
		originalSend = redis.send;
		redis.get = mock(() => Promise.resolve(null)) as typeof redis.get;
		redis.setex = mock(() => Promise.resolve("OK")) as typeof redis.setex;
		redis.srem = mock(() => Promise.resolve(1)) as typeof redis.srem;
		redis.rpush = mock(() => Promise.resolve(1)) as typeof redis.rpush;
		redis.send = mock(() => Promise.resolve(null)) as typeof redis.send;
	});

	afterEach(() => {
		redis.get = originalGet;
		redis.setex = originalSetex;
		redis.srem = originalSrem;
		redis.rpush = originalRpush;
		redis.send = originalSend;
	});

	it("should mark order as delivered successfully", async () => {
		const verificationCode = "1234567890";
		const hmacSecret = Bun.env.HMAC_SECRET || "change-me-in-production";
		const verificationHash = new Bun.CryptoHasher("sha256", hmacSecret)
			.update(verificationCode)
			.digest("hex");

		const mockOrder: Order = {
			id: "order-1",
			customerName: "John Doe",
			phone: "1234567890",
			address: "123 Main St",
			orderItems: [],
			total: 100,
			status: "out_for_delivery",
			driverId: "driver-1",
			verificationHash,
			createdAt: new Date().toISOString(),
		};

		mockOrderRepo.findById = mock(() => Promise.resolve(mockOrder));
		redis.get = mock(() => Promise.resolve(null)) as typeof redis.get;

		const result = await useCase.execute(
			"order-1",
			"driver-1",
			verificationCode,
			mockOrderRepo,
			mockCustomerRepo,
			mockProductRepo,
			mockCouponRepo,
			mockChangeOrderStatusUC,
			mockMarkAsReadyUC,
		);

		expect(result.success).toBe(true);
		expect(mockOrderRepo.findById).toHaveBeenCalledWith("order-1");
		expect(mockChangeOrderStatusUC.execute).toHaveBeenCalledWith(
			{
				id: "order-1",
				status: "delivered",
				cancellation: {},
			},
			mockOrderRepo,
			mockCustomerRepo,
			mockProductRepo,
			mockCouponRepo,
			mockMarkAsReadyUC,
		);
		expect(redis.srem).toHaveBeenCalledWith("busy_drivers", "driver-1");
		expect(redis.rpush).toHaveBeenCalledWith("available_drivers", "driver-1");
		expect(redis.get).toHaveBeenCalledWith("order:attempt:order-1");
		expect(redis.setex).toHaveBeenCalledWith("order:attempt:order-1", 60, "1");
	});

	it("should throw NotFoundError when order not found", async () => {
		mockOrderRepo.findById = mock(() => Promise.resolve(null));

		await expect(
			useCase.execute(
				"non-existent",
				"driver-1",
				"1234567890",
				mockOrderRepo,
				mockCustomerRepo,
				mockProductRepo,
				mockCouponRepo,
				mockChangeOrderStatusUC,
				mockMarkAsReadyUC,
			),
		).rejects.toThrow(NotFoundError);
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
				"1234567890",
				mockOrderRepo,
				mockCustomerRepo,
				mockProductRepo,
				mockCouponRepo,
				mockChangeOrderStatusUC,
				mockMarkAsReadyUC,
			),
		).rejects.toThrow(UnauthorizedError);
	});

	it("should throw BadRequestError when order has no verification hash", async () => {
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

		mockOrderRepo.findById = mock(() => Promise.resolve(mockOrder));

		await expect(
			useCase.execute(
				"order-1",
				"driver-1",
				"1234567890",
				mockOrderRepo,
				mockCustomerRepo,
				mockProductRepo,
				mockCouponRepo,
				mockChangeOrderStatusUC,
				mockMarkAsReadyUC,
			),
		).rejects.toThrow(BadRequestError);
	});

	it("should throw ForbiddenError when verification code is invalid", async () => {
		const verificationCode = "1234567890";
		const hmacSecret = Bun.env.HMAC_SECRET || "change-me-in-production";
		const verificationHash = new Bun.CryptoHasher("sha256", hmacSecret)
			.update(verificationCode)
			.digest("hex");

		const mockOrder: Order = {
			id: "order-1",
			customerName: "John Doe",
			phone: "1234567890",
			address: "123 Main St",
			orderItems: [],
			total: 100,
			status: "out_for_delivery",
			driverId: "driver-1",
			verificationHash,
			createdAt: new Date().toISOString(),
		};

		mockOrderRepo.findById = mock(() => Promise.resolve(mockOrder));

		await expect(
			useCase.execute(
				"order-1",
				"driver-1",
				"wrong-code",
				mockOrderRepo,
				mockCustomerRepo,
				mockProductRepo,
				mockCouponRepo,
				mockChangeOrderStatusUC,
				mockMarkAsReadyUC,
			),
		).rejects.toThrow(ForbiddenError);
	});

	it("should throw TooManyRequestsError when rate limit exceeded", async () => {
		const verificationCode = "1234567890";
		const hmacSecret = Bun.env.HMAC_SECRET || "change-me-in-production";
		const verificationHash = new Bun.CryptoHasher("sha256", hmacSecret)
			.update(verificationCode)
			.digest("hex");

		const mockOrder: Order = {
			id: "order-1",
			customerName: "John Doe",
			phone: "1234567890",
			address: "123 Main St",
			orderItems: [],
			total: 100,
			status: "out_for_delivery",
			driverId: "driver-1",
			verificationHash,
			createdAt: new Date().toISOString(),
		};

		mockOrderRepo.findById = mock(() => Promise.resolve(mockOrder));
		redis.get = mock(() => Promise.resolve("5")) as typeof redis.get;

		await expect(
			useCase.execute(
				"order-1",
				"driver-1",
				verificationCode,
				mockOrderRepo,
				mockCustomerRepo,
				mockProductRepo,
				mockCouponRepo,
				mockChangeOrderStatusUC,
				mockMarkAsReadyUC,
			),
		).rejects.toThrow(TooManyRequestsError);

		expect(redis.get).toHaveBeenCalledWith("order:attempt:order-1");
	});
});
