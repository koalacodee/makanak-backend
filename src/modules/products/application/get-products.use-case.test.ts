import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import type { Attachment, IAttachmentRepository } from "@/shared/attachments";
import filehub from "@/shared/filehub";
import { ValidationError } from "../../../shared/presentation/errors";
import type { Product } from "../domain/product.entity";
import type { IProductRepository } from "../domain/products.iface";
import { GetProductsUseCase } from "./get-products.use-case";

describe("GetProductsUseCase", () => {
	let useCase: GetProductsUseCase;
	let mockRepo: IProductRepository;
	let mockAttachmentRepo: IAttachmentRepository;
	let originalGetSignedUrlBatch: typeof filehub.getSignedUrlBatch;

	beforeEach(() => {
		useCase = new GetProductsUseCase();
		mockRepo = {
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
		mockAttachmentRepo = {
			findById: mock(() => Promise.resolve(null)),
			findByTargetId: mock(() => Promise.resolve([])),
			findByTargetIds: mock(() => Promise.resolve([])),
			create: mock(() => Promise.resolve({} as Attachment)),
			update: mock(() => Promise.resolve({} as Attachment)),
			delete: mock(() => Promise.resolve()),
			deleteByTargetId: mock(() => Promise.resolve()),
		};
		originalGetSignedUrlBatch = filehub.getSignedUrlBatch;
		filehub.getSignedUrlBatch = mock(() =>
			Promise.resolve([]),
		) as typeof filehub.getSignedUrlBatch;
	});

	afterEach(() => {
		filehub.getSignedUrlBatch = originalGetSignedUrlBatch;
	});

	it("should return products with pagination", async () => {
		const mockProducts: Product[] = [
			{
				id: "1",
				name: "Product 1",
				price: 10,
				category: "cat-1",
				description: "Description 1",
				stock: 10,
				quantityType: "count",
			},
		];

		mockRepo.findAll = mock(() =>
			Promise.resolve({ data: mockProducts, total: 1 }),
		);
		mockAttachmentRepo.findByTargetIds = mock(() => Promise.resolve([]));
		filehub.getSignedUrlBatch = mock(() => Promise.resolve([]));

		const result = await useCase.execute(
			{ page: 1, limit: 20 },
			mockRepo,
			mockAttachmentRepo,
		);

		expect(result.data).toHaveLength(1);
		expect(result.data[0].id).toBe("1");
		expect(result.data[0].name).toBe("Product 1");
		expect(result.pagination.page).toBe(1);
		expect(result.pagination.limit).toBe(20);
		expect(result.pagination.total).toBe(1);
		expect(result.pagination.totalPages).toBe(1);
		expect(mockRepo.findAll).toHaveBeenCalledWith({
			categoryId: undefined,
			inStock: undefined,
			page: 1,
			limit: 20,
			search: undefined,
		});
	});

	it("should use default pagination values", async () => {
		mockRepo.findAll = mock(() => Promise.resolve({ data: [], total: 0 }));
		mockAttachmentRepo.findByTargetIds = mock(() => Promise.resolve([]));
		filehub.getSignedUrlBatch = mock(() => Promise.resolve([]));

		await useCase.execute({}, mockRepo, mockAttachmentRepo);

		expect(mockRepo.findAll).toHaveBeenCalledWith({
			categoryId: undefined,
			inStock: undefined,
			page: 1,
			limit: 20,
			search: undefined,
		});
	});

	it("should filter by category", async () => {
		mockAttachmentRepo.findByTargetIds = mock(() => Promise.resolve([]));
		filehub.getSignedUrlBatch = mock(() => Promise.resolve([]));

		await useCase.execute({ category: "cat-1" }, mockRepo, mockAttachmentRepo);

		expect(mockRepo.findAll).toHaveBeenCalledWith({
			categoryId: "cat-1",
			inStock: undefined,
			page: 1,
			limit: 20,
			search: undefined,
		});
	});

	it("should filter by inStock", async () => {
		mockAttachmentRepo.findByTargetIds = mock(() => Promise.resolve([]));
		filehub.getSignedUrlBatch = mock(() => Promise.resolve([]));

		await useCase.execute({ inStock: true }, mockRepo, mockAttachmentRepo);

		expect(mockRepo.findAll).toHaveBeenCalledWith({
			categoryId: undefined,
			inStock: true,
			page: 1,
			limit: 20,
			search: undefined,
		});
	});

	it("should calculate totalPages correctly", async () => {
		mockRepo.findAll = mock(() => Promise.resolve({ data: [], total: 50 }));
		mockAttachmentRepo.findByTargetIds = mock(() => Promise.resolve([]));
		filehub.getSignedUrlBatch = mock(() => Promise.resolve([]));

		const result = await useCase.execute(
			{ page: 1, limit: 20 },
			mockRepo,
			mockAttachmentRepo,
		);

		expect(result.pagination.totalPages).toBe(3); // Math.ceil(50/20) = 3
	});

	it("should throw ValidationError for invalid page", async () => {
		await expect(
			useCase.execute({ page: 0 }, mockRepo, mockAttachmentRepo),
		).rejects.toThrow(ValidationError);
	});

	it("should throw ValidationError for invalid limit (too low)", async () => {
		await expect(
			useCase.execute({ limit: 0 }, mockRepo, mockAttachmentRepo),
		).rejects.toThrow(ValidationError);
	});

	it("should throw ValidationError for invalid limit (too high)", async () => {
		await expect(
			useCase.execute({ limit: 101 }, mockRepo, mockAttachmentRepo),
		).rejects.toThrow(ValidationError);
	});
});
