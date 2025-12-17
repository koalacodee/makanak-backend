import { describe, it, expect, beforeEach, mock } from "bun:test";
import { GetProductsUseCase } from "./get-products.use-case";
import type { IProductRepository } from "../domain/products.iface";
import type { Product } from "../domain/product.entity";
import { ValidationError } from "../../../shared/presentation/errors";

describe("GetProductsUseCase", () => {
  let useCase: GetProductsUseCase;
  let mockRepo: IProductRepository;

  beforeEach(() => {
    useCase = new GetProductsUseCase();
    mockRepo = {
      findAll: mock(() => Promise.resolve({ data: [], total: 0 })),
      findById: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Product)),
      update: mock(() => Promise.resolve({} as Product)),
      delete: mock(() => Promise.resolve()),
    };
  });

  it("should return products with pagination", async () => {
    const mockProducts: Product[] = [
      {
        id: "1",
        name: "Product 1",
        price: "10.00",
        unit: "kg",
        category: "cat-1",
        image: "https://example.com/img1.jpg",
        description: "Description 1",
        stock: 10,
      },
    ];

    mockRepo.findAll = mock(() =>
      Promise.resolve({ data: mockProducts, total: 1 })
    );

    const result = await useCase.execute({ page: 1, limit: 20 }, mockRepo);

    expect(result.data).toEqual(mockProducts);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(20);
    expect(result.pagination.total).toBe(1);
    expect(result.pagination.totalPages).toBe(1);
    expect(mockRepo.findAll).toHaveBeenCalledWith({
      categoryId: undefined,
      inStock: undefined,
      page: 1,
      limit: 20,
    });
  });

  it("should use default pagination values", async () => {
    mockRepo.findAll = mock(() => Promise.resolve({ data: [], total: 0 }));

    await useCase.execute({}, mockRepo);

    expect(mockRepo.findAll).toHaveBeenCalledWith({
      categoryId: undefined,
      inStock: undefined,
      page: 1,
      limit: 20,
    });
  });

  it("should filter by category", async () => {
    await useCase.execute({ category: "cat-1" }, mockRepo);

    expect(mockRepo.findAll).toHaveBeenCalledWith({
      categoryId: "cat-1",
      inStock: undefined,
      page: 1,
      limit: 20,
    });
  });

  it("should filter by inStock", async () => {
    await useCase.execute({ inStock: true }, mockRepo);

    expect(mockRepo.findAll).toHaveBeenCalledWith({
      categoryId: undefined,
      inStock: true,
      page: 1,
      limit: 20,
    });
  });

  it("should calculate totalPages correctly", async () => {
    mockRepo.findAll = mock(() => Promise.resolve({ data: [], total: 50 }));

    const result = await useCase.execute({ page: 1, limit: 20 }, mockRepo);

    expect(result.pagination.totalPages).toBe(3); // Math.ceil(50/20) = 3
  });

  it("should throw ValidationError for invalid page", async () => {
    await expect(useCase.execute({ page: 0 }, mockRepo)).rejects.toThrow(
      ValidationError
    );
  });

  it("should throw ValidationError for invalid limit (too low)", async () => {
    await expect(useCase.execute({ limit: 0 }, mockRepo)).rejects.toThrow(
      ValidationError
    );
  });

  it("should throw ValidationError for invalid limit (too high)", async () => {
    await expect(useCase.execute({ limit: 101 }, mockRepo)).rejects.toThrow(
      ValidationError
    );
  });
});
