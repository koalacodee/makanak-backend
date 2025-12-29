import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import type { Attachment, IAttachmentRepository } from "@/shared/attachments";
import filehub from "@/shared/filehub";
import { NotFoundError } from "../../../shared/presentation/errors";
import type { Product } from "../domain/product.entity";
import type { IProductRepository } from "../domain/products.iface";
import { GetProductUseCase } from "./get-product.use-case";

describe("GetProductUseCase", () => {
	let useCase: GetProductUseCase;
	let mockRepo: IProductRepository;
	let mockAttachmentRepo: IAttachmentRepository;
	let originalGetSignedUrl: typeof filehub.getSignedUrl;

	beforeEach(() => {
		useCase = new GetProductUseCase();
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
		originalGetSignedUrl = filehub.getSignedUrl;
		filehub.getSignedUrl = mock(() =>
			Promise.resolve({
				filename: "product.jpg",
				signedUrl: "https://example.com/signed/product.jpg",
				expirationDate: new Date(),
			}),
		) as typeof filehub.getSignedUrl;
	});

	afterEach(() => {
		filehub.getSignedUrl = originalGetSignedUrl;
	});

	it("should return product when found", async () => {
		const mockProduct: Product = {
			id: "1",
			name: "Product 1",
			price: 10,
			category: "cat-1",
			description: "Description 1",
			stock: 10,
			quantityType: "count",
		};

		mockRepo.findById = mock(() => Promise.resolve(mockProduct));
		mockAttachmentRepo.findByTargetId = mock(() => Promise.resolve([]));

		const result = await useCase.execute("1", mockRepo, mockAttachmentRepo);

		expect(result.id).toBe("1");
		expect(result.name).toBe("Product 1");
		expect(result.image).toBeUndefined();
		expect(mockRepo.findById).toHaveBeenCalledWith("1");
		expect(mockAttachmentRepo.findByTargetId).toHaveBeenCalledWith("1");
	});

	it("should return product with image when attachment exists", async () => {
		const mockProduct: Product = {
			id: "1",
			name: "Product 1",
			price: 10,
			category: "cat-1",
			description: "Description 1",
			stock: 10,
			quantityType: "count",
		};

		const mockAttachment: Attachment = {
			id: "att-1",
			filename: "product.jpg",
			targetId: "1",
			size: 1024,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		mockRepo.findById = mock(() => Promise.resolve(mockProduct));
		mockAttachmentRepo.findByTargetId = mock(() =>
			Promise.resolve([mockAttachment]),
		);

		const result = await useCase.execute("1", mockRepo, mockAttachmentRepo);

		expect(result.id).toBe("1");
		expect(result.image).toBe("https://example.com/signed/product.jpg");
		expect(filehub.getSignedUrl).toHaveBeenCalledWith("product.jpg");
	});

	it("should throw NotFoundError when product not found", async () => {
		mockRepo.findById = mock(() => Promise.resolve(null));
		mockAttachmentRepo.findByTargetId = mock(() => Promise.resolve([]));

		await expect(
			useCase.execute("non-existent", mockRepo, mockAttachmentRepo),
		).rejects.toThrow(NotFoundError);
		expect(mockRepo.findById).toHaveBeenCalledWith("non-existent");
	});
});
