import { beforeEach, describe, expect, it, mock } from "bun:test";
import { NotFoundError } from "../../../shared/presentation/errors";
import type { ICategoryRepository } from "../domain/categories.iface";
import type { Category } from "../domain/category.entity";
import { UpdateCategoryUseCase } from "./update-category.use-case";

describe("UpdateCategoryUseCase", () => {
	let useCase: UpdateCategoryUseCase;
	let mockRepo: ICategoryRepository;

	beforeEach(() => {
		useCase = new UpdateCategoryUseCase();
		mockRepo = {
			findAll: mock(() => Promise.resolve([])),
			findById: mock(() => Promise.resolve(null)),
			create: mock(() => Promise.resolve({} as Category)),
			update: mock(() =>
				Promise.resolve({
					id: "1",
					name: "Updated Category",
					icon: "icon-1",
					color: "blue",
					isHidden: false,
					isLocked: false,
				}),
			),
			delete: mock(() => Promise.resolve()),
			findCategoryWithProductsById: mock(() => Promise.resolve(null)),
		};
	});

	it("should update category successfully", async () => {
		const existingCategory: Category = {
			id: "1",
			name: "Category 1",
			icon: "icon-1",
			color: "blue",
			isHidden: false,
			isLocked: false,
		};

		mockRepo.findById = mock(() => Promise.resolve(existingCategory));

		const updateData = { name: "Updated Category" };
		const result = await useCase.execute("1", updateData, mockRepo);

		expect(result.category.name).toBe("Updated Category");
		expect(mockRepo.findById).toHaveBeenCalledWith("1");
		expect(mockRepo.update).toHaveBeenCalledWith("1", updateData);
	});

	it("should throw NotFoundError when category not found", async () => {
		mockRepo.findById = mock(() => Promise.resolve(null));

		await expect(
			useCase.execute("non-existent", { name: "Updated" }, mockRepo),
		).rejects.toThrow(NotFoundError);
		expect(mockRepo.update).not.toHaveBeenCalled();
	});

	it("should update multiple fields", async () => {
		const existingCategory: Category = {
			id: "1",
			name: "Category 1",
			icon: "icon-1",
			color: "blue",
			isHidden: false,
			isLocked: false,
		};

		mockRepo.findById = mock(() => Promise.resolve(existingCategory));

		const updateData = {
			name: "Updated Category",
			color: "red",
			isHidden: true,
		};

		await useCase.execute("1", updateData, mockRepo);

		expect(mockRepo.update).toHaveBeenCalledWith("1", updateData);
	});
});
