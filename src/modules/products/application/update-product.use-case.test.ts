import { describe, it, expect, beforeEach, mock } from "bun:test";
import { UpdateProductUseCase } from "./update-product.use-case";
import type { IProductRepository } from "../domain/products.iface";
import type { Product } from "../domain/product.entity";
import { NotFoundError } from "../../../shared/presentation/errors";

describe("UpdateProductUseCase", () => {
  let useCase: UpdateProductUseCase;
  let mockRepo: IProductRepository;

  beforeEach(() => {
    useCase = new UpdateProductUseCase();
    mockRepo = {
      findAll: mock(() => Promise.resolve({ data: [], total: 0 })),
      findById: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Product)),
      update: mock(() =>
        Promise.resolve({
          id: "1",
          name: "Updated Product",
          price: "15.00",
          unit: "kg",
          category: "cat-1",
          image: "https://example.com/img.jpg",
          description: "Updated description",
          stock: 20,
        })
      ),
      delete: mock(() => Promise.resolve()),
    };
  });

  it("should update product successfully", async () => {
    const existingProduct: Product = {
      id: "1",
      name: "Product 1",
      price: "10.00",
      unit: "kg",
      category: "cat-1",
      image: "https://example.com/img1.jpg",
      description: "Description 1",
      stock: 10,
    };

    mockRepo.findById = mock(() => Promise.resolve(existingProduct));

    const updateData = { name: "Updated Product", price: "15.00" };
    const result = await useCase.execute("1", updateData, mockRepo);

    expect(result.name).toBe("Updated Product");
    expect(result.price).toBe("15.00");
    expect(mockRepo.findById).toHaveBeenCalledWith("1");
    expect(mockRepo.update).toHaveBeenCalledWith("1", updateData);
  });

  it("should throw NotFoundError when product not found", async () => {
    mockRepo.findById = mock(() => Promise.resolve(null));

    await expect(
      useCase.execute("non-existent", { name: "Updated" }, mockRepo)
    ).rejects.toThrow(NotFoundError);
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it("should update multiple fields", async () => {
    const existingProduct: Product = {
      id: "1",
      name: "Product 1",
      price: "10.00",
      unit: "kg",
      category: "cat-1",
      image: "https://example.com/img1.jpg",
      description: "Description 1",
      stock: 10,
    };

    mockRepo.findById = mock(() => Promise.resolve(existingProduct));

    const updateData = {
      name: "Updated Product",
      price: "15.00",
      stock: 20,
    };

    await useCase.execute("1", updateData, mockRepo);

    expect(mockRepo.update).toHaveBeenCalledWith("1", updateData);
  });
});

