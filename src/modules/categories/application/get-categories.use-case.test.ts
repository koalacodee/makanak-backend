import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import type { Attachment, IAttachmentRepository } from "@/shared/attachments";
import filehub from "@/shared/filehub";
import type { ICategoryRepository } from "../domain/categories.iface";
import type { Category } from "../domain/category.entity";
import { GetCategoriesUseCase } from "./get-categories.use-case";

describe("GetCategoriesUseCase", () => {
	let useCase: GetCategoriesUseCase;
	let mockCategoryRepo: ICategoryRepository;
	let mockAttachmentRepo: IAttachmentRepository;
	let originalGetSignedUrlBatch: typeof filehub.getSignedUrlBatch;

	beforeEach(() => {
		useCase = new GetCategoriesUseCase();
		mockCategoryRepo = {
			findAll: mock(() => Promise.resolve([])),
			findById: mock(() => Promise.resolve(null)),
			create: mock(() => Promise.resolve({} as Category)),
			update: mock(() => Promise.resolve({} as Category)),
			delete: mock(() => Promise.resolve()),
			findCategoryWithProductsById: mock(() => Promise.resolve(null)),
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
		// Mock filehub.getSignedUrlBatch
		originalGetSignedUrlBatch = filehub.getSignedUrlBatch;
		filehub.getSignedUrlBatch = mock(() =>
			Promise.resolve([]),
		) as typeof filehub.getSignedUrlBatch;
	});

	afterEach(() => {
		filehub.getSignedUrlBatch = originalGetSignedUrlBatch;
	});

	it("should return all categories excluding hidden ones by default", async () => {
		const mockCategories: Category[] = [
			{
				id: "1",
				name: "Category 1",
				icon: "icon-1",
				color: "blue",
				isHidden: false,
				isLocked: false,
			},
		];

		mockCategoryRepo.findAll = mock(() => Promise.resolve(mockCategories));
		mockAttachmentRepo.findByTargetIds = mock(() => Promise.resolve([]));
		filehub.getSignedUrlBatch = mock(() => Promise.resolve([]));

		const result = await useCase.execute(
			false,
			mockCategoryRepo,
			mockAttachmentRepo,
		);

		expect(result).toEqual([
			{
				...mockCategories[0],
				image: undefined,
			},
		]);
		expect(mockCategoryRepo.findAll).toHaveBeenCalledWith(false);
		expect(mockAttachmentRepo.findByTargetIds).toHaveBeenCalledWith(["1"]);
	});

	it("should return all categories including hidden ones when requested", async () => {
		const mockCategories: Category[] = [
			{
				id: "1",
				name: "Category 1",
				icon: "icon-1",
				color: "blue",
				isHidden: false,
				isLocked: false,
			},
			{
				id: "2",
				name: "Category 2",
				icon: "icon-2",
				color: "red",
				isHidden: true,
				isLocked: false,
			},
		];

		const mockAttachments: Attachment[] = [
			{
				id: "att-1",
				filename: "image1.jpg",
				targetId: "1",
				size: 1024,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		];

		const mockSignedUrls = [
			{
				filename: "image1.jpg",
				signedUrl: "https://example.com/signed/image1.jpg",
				expirationDate: new Date(),
			},
		];

		mockCategoryRepo.findAll = mock(() => Promise.resolve(mockCategories));
		mockAttachmentRepo.findByTargetIds = mock(() =>
			Promise.resolve(mockAttachments),
		);
		filehub.getSignedUrlBatch = mock(() => Promise.resolve(mockSignedUrls));

		const result = await useCase.execute(
			true,
			mockCategoryRepo,
			mockAttachmentRepo,
		);

		expect(result).toEqual([
			{
				...mockCategories[0],
				image: "https://example.com/signed/image1.jpg",
			},
			{
				...mockCategories[1],
				image: undefined,
			},
		]);
		expect(mockCategoryRepo.findAll).toHaveBeenCalledWith(true);
		expect(mockAttachmentRepo.findByTargetIds).toHaveBeenCalledWith(["1", "2"]);
	});

	it("should return empty array when no categories exist", async () => {
		mockCategoryRepo.findAll = mock(() => Promise.resolve([]));
		mockAttachmentRepo.findByTargetIds = mock(() => Promise.resolve([]));
		filehub.getSignedUrlBatch = mock(() => Promise.resolve([]));

		const result = await useCase.execute(
			false,
			mockCategoryRepo,
			mockAttachmentRepo,
		);

		expect(result).toEqual([]);
		expect(mockAttachmentRepo.findByTargetIds).toHaveBeenCalledWith([]);
	});
});
