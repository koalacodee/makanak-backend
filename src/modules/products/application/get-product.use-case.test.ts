import { describe, it, expect, beforeEach, mock } from "bun:test";
import { GetProductUseCase } from "./get-product.use-case";
import type { IProductRepository } from "../domain/products.iface";
import type { Product } from "../domain/product.entity";
import { NotFoundError } from "../../../shared/presentation/errors";

describe("GetProductUseCase", () => {
  let useCase: GetProductUseCase;
  let mockRepo: IProductRepository;

  beforeEach(() => {
    useCase = new GetProductUseCase();
    mockRepo = {
      findAll: mock(() => Promise.resolve({ data: [], total: 0 })),
      findById: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Product)),
      update: mock(() => Promise.resolve({} as Product)),
      delete: mock(() => Promise.resolve()),
    };
  });

  it("should return product when found", async () => {
    const mockProduct: Product = {
      id: "1",
      name: "Product 1",
      price: "10.00",
      unit: "kg",
      category: "cat-1",
      image: "https://example.com/img1.jpg",
      description: "Description 1",
      stock: 10,
    };

    mockRepo.findById = mock(() => Promise.resolve(mockProduct));

    const result = await useCase.execute("1", mockRepo);

    expect(result).toEqual(mockProduct);
    expect(mockRepo.findById).toHaveBeenCalledWith("1");
  });

  it("should throw NotFoundError when product not found", async () => {
    mockRepo.findById = mock(() => Promise.resolve(null));

    await expect(useCase.execute("non-existent", mockRepo)).rejects.toThrow(
      NotFoundError
    );
    expect(mockRepo.findById).toHaveBeenCalledWith("non-existent");
  });
});

