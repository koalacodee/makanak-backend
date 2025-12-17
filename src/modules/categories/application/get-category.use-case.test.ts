import { describe, it, expect, beforeEach, mock } from "bun:test";
import { GetCategoryUseCase } from "./get-category.use-case";
import type { ICategoryRepository } from "../domain/categories.iface";
import type { Category } from "../domain/category.entity";
import { NotFoundError } from "../../../shared/presentation/errors";

describe("GetCategoryUseCase", () => {
  let useCase: GetCategoryUseCase;
  let mockRepo: ICategoryRepository;

  beforeEach(() => {
    useCase = new GetCategoryUseCase();
    mockRepo = {
      findAll: mock(() => Promise.resolve([])),
      findById: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Category)),
      update: mock(() => Promise.resolve({} as Category)),
      delete: mock(() => Promise.resolve()),
    };
  });

  it("should return category when found", async () => {
    const mockCategory: Category = {
      id: "1",
      name: "Category 1",
      icon: "icon-1",
      color: "blue",
      image: "https://example.com/img1.jpg",
      isHidden: false,
      isLocked: false,
    };

    mockRepo.findById = mock(() => Promise.resolve(mockCategory));

    const result = await useCase.execute("1", mockRepo);

    expect(result).toEqual(mockCategory);
    expect(mockRepo.findById).toHaveBeenCalledWith("1");
  });

  it("should throw NotFoundError when category not found", async () => {
    mockRepo.findById = mock(() => Promise.resolve(null));

    await expect(useCase.execute("non-existent", mockRepo)).rejects.toThrow(
      NotFoundError
    );
    expect(mockRepo.findById).toHaveBeenCalledWith("non-existent");
  });
});

