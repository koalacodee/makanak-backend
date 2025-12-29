import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { ICouponRepository } from "@/modules/coupons/domain/coupon.iface";
import type { ICustomerRepository } from "@/modules/customers/domain/customers.iface";
import type { MarkAsReadyUseCase } from "@/modules/drivers/application/mark-as-ready.use-case";
import type { IProductRepository } from "@/modules/products/domain/products.iface";
import {
	BadRequestError,
	NotFoundError,
} from "../../../shared/presentation/errors";
import type { Order } from "../domain/order.entity";
import type { IOrderRepository } from "../domain/orders.iface";
import { CancelOrderByInventoryUseCase } from "./cancel-order-by-inventory.use-case";
import type { ChangeOrderStatusUseCase } from "./change-order-status.use-case";

describe("CancelOrderByInventoryUseCase", () => {
	let useCase: CancelOrderByInventoryUseCase;
	let mockOrderRepo: IOrderRepository;
	let mockProductRepo: IProductRepository;
	let mockCouponRepo: ICouponRepository;
	let mockCustomerRepo: ICustomerRepository;
	let mockChangeOrderStatusUC: ChangeOrderStatusUseCase;
	let mockMarkAsReadyUC: MarkAsReadyUseCase;

	beforeEach(() => {
		useCase = new CancelOrderByInventoryUseCase();
		mockOrderRepo = {
			findAll: mock(() => Promise.resolve({ data: [], total: 0 })),
			findById: mock(() => Promise.resolve(null)),
			create: mock(() => Promise.resolve({} as Order)),
			update: mock(() => Promise.resolve({} as Order)),
			getReadyOrdersForDriver: mock(() =>
				Promise.resolve({ orders: [], counts: [] }),
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
				Promise.resolve({ order: {} as Order, cancellationPutUrl: undefined }),
			),
		} as any;
		mockMarkAsReadyUC = {} as any;
	});

	it("should cancel pending order successfully", async () => {
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

		const cancelledOrder: Order = {
			...mockOrder,
			status: "cancelled",
		};

		mockOrderRepo.findById = mock(() => Promise.resolve(mockOrder));
		mockChangeOrderStatusUC.execute = mock(() =>
			Promise.resolve({ order: cancelledOrder, cancellationPutUrl: undefined }),
		) as any;

		const result = await useCase.execute(
			"order-1",
			{ reason: "Out of stock" },
			mockOrderRepo,
			mockChangeOrderStatusUC,
			mockCustomerRepo,
			mockProductRepo,
			mockCouponRepo,
			mockMarkAsReadyUC,
		);

		expect(result.order.status).toBe("cancelled");
		expect(mockOrderRepo.findById).toHaveBeenCalledWith("order-1");
		expect(mockChangeOrderStatusUC.execute).toHaveBeenCalledWith(
			{
				id: "order-1",
				status: "cancelled",
				cancellation: { reason: "Out of stock" },
			},
			mockOrderRepo,
			mockCustomerRepo,
			mockProductRepo,
			mockCouponRepo,
			mockMarkAsReadyUC,
		);
	});

	it("should cancel order with file attachment", async () => {
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

		const cancelledOrder: Order = {
			...mockOrder,
			status: "cancelled",
		};

		mockOrderRepo.findById = mock(() => Promise.resolve(mockOrder));
		mockChangeOrderStatusUC.execute = mock(() =>
			Promise.resolve({
				order: cancelledOrder,
				cancellationPutUrl: "https://example.com/upload.jpg",
			}),
		) as any;

		const result = await useCase.execute(
			"order-1",
			{ reason: "Damaged goods", attachWithFileExtension: ".jpg" },
			mockOrderRepo,
			mockChangeOrderStatusUC,
			mockCustomerRepo,
			mockProductRepo,
			mockCouponRepo,
			mockMarkAsReadyUC,
		);

		expect(result.cancellationPutUrl).toBe("https://example.com/upload.jpg");
		expect(mockChangeOrderStatusUC.execute).toHaveBeenCalledWith(
			{
				id: "order-1",
				status: "cancelled",
				cancellation: {
					reason: "Damaged goods",
					attachWithFileExtension: ".jpg",
				},
			},
			mockOrderRepo,
			mockCustomerRepo,
			mockProductRepo,
			mockCouponRepo,
			mockMarkAsReadyUC,
		);
	});

	it("should throw NotFoundError when order not found", async () => {
		mockOrderRepo.findById = mock(() => Promise.resolve(null));

		await expect(
			useCase.execute(
				"non-existent",
				{ reason: "Test" },
				mockOrderRepo,
				mockChangeOrderStatusUC,
				mockCustomerRepo,
				mockProductRepo,
				mockCouponRepo,
				mockMarkAsReadyUC,
			),
		).rejects.toThrow(NotFoundError);

		expect(mockChangeOrderStatusUC.execute).not.toHaveBeenCalled();
	});

	it("should throw BadRequestError when order status is not pending", async () => {
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

		await expect(
			useCase.execute(
				"order-1",
				{ reason: "Test" },
				mockOrderRepo,
				mockChangeOrderStatusUC,
				mockCustomerRepo,
				mockProductRepo,
				mockCouponRepo,
				mockMarkAsReadyUC,
			),
		).rejects.toThrow(BadRequestError);

		expect(mockChangeOrderStatusUC.execute).not.toHaveBeenCalled();
	});

	it("should throw BadRequestError for processing status", async () => {
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

		mockOrderRepo.findById = mock(() => Promise.resolve(mockOrder));

		await expect(
			useCase.execute(
				"order-1",
				{ reason: "Test" },
				mockOrderRepo,
				mockChangeOrderStatusUC,
				mockCustomerRepo,
				mockProductRepo,
				mockCouponRepo,
				mockMarkAsReadyUC,
			),
		).rejects.toThrow(BadRequestError);
	});
});
