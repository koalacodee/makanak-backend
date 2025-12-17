import { describe, it, expect, beforeEach, mock } from "bun:test";
import { GetCategoriesUseCase } from "./get-categories.use-case";
import type { ICategoryRepository } from "../domain/categories.iface";
import type { Category } from "../domain/category.entity";

describe("GetCategoriesUseCase", () => {
  let useCase: GetCategoriesUseCase;
  let mockRepo: ICategoryRepository;

  beforeEach(() => {
    useCase = new GetCategoriesUseCase();
    mockRepo = {
      findAll: mock(() => Promise.resolve([])),
      findById: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Category)),
      update: mock(() => Promise.resolve({} as Category)),
      delete: mock(() => Promise.resolve()),
    };
  });

  it("should return all categories excluding hidden ones by default", async () => {
    const mockCategories: Category[] = [
      {
        id: "1",
        name: "Category 1",
        icon: "icon-1",
        color: "blue",
        image: "https://example.com/img1.jpg",
        isHidden: false,
        isLocked: false,
      },
    ];

    mockRepo.findAll = mock(() => Promise.resolve(mockCategories));

    const result = await useCase.execute(false, mockRepo);

    expect(result).toEqual(mockCategories);
    expect(mockRepo.findAll).toHaveBeenCalledWith(false);
  });

  it("should return all categories including hidden ones when requested", async () => {
    const mockCategories: Category[] = [
      {
        id: "1",
        name: "Category 1",
        icon: "icon-1",
        color: "blue",
        image: "https://example.com/img1.jpg",
        isHidden: false,
        isLocked: false,
      },
      {
        id: "2",
        name: "Category 2",
        icon: "icon-2",
        color: "red",
        image: "https://example.com/img2.jpg",
        isHidden: true,
        isLocked: false,
      },
    ];

    mockRepo.findAll = mock(() => Promise.resolve(mockCategories));

    const result = await useCase.execute(true, mockRepo);

    expect(result).toEqual(mockCategories);
    expect(mockRepo.findAll).toHaveBeenCalledWith(true);
  });

  it("should return empty array when no categories exist", async () => {
    mockRepo.findAll = mock(() => Promise.resolve([]));

    const result = await useCase.execute(false, mockRepo);

    expect(result).toEqual([]);
  });
});

