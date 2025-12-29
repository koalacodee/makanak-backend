import { beforeEach, describe, expect, it, mock } from "bun:test";
import { ValidationError } from "../../../shared/presentation/errors";
import type { Product } from "../domain/product.entity";
import type { IProductRepository } from "../domain/products.iface";
import { CreateProductUseCase } from "./create-product.use-case";

describe("CreateProductUseCase", () => {
  let useCase: CreateProductUseCase;
  let mockRepo: IProductRepository;

  beforeEach(() => {
    useCase = new CreateProductUseCase();
    mockRepo = {
      findAll: mock(() => Promise.resolve({ data: [], total: 0 })),
      findById: mock(() => Promise.resolve(null)),
      create: mock(() =>
        Promise.resolve({
          id: "new-id",
          name: "New Product",
          price: 10,
          category: "cat-1",
          description: "Description",
          stock: 10,
          quantityType: "count" as const,
        } as Product)
      ),
      findByIds: mock(() => Promise.resolve([])),
      existsByIds: mock(() => Promise.resolve(false)),
      updateStock: mock(() => Promise.resolve()),
      updateStockMany: mock(() => Promise.resolve()),
      update: mock(() => Promise.resolve({} as Product)),
      delete: mock(() => Promise.resolve()),
    };
  });

  it("should create a product successfully", async () => {
    const productData: Omit<Product, "id"> = {
      name: "New Product",
      price: 10,
      category: "cat-1",
      description: "Description",
      stock: 10,
      quantityType: "count",
    };

    const result = await useCase.execute(productData, mockRepo);

    expect(result.product.id).toBe("new-id");
    expect(mockRepo.create).toHaveBeenCalled();
  });

  it("should throw ValidationError for empty name", async () => {
    const productData: Omit<Product, "id"> = {
      name: "",
      price: 10,
      category: "cat-1",
      description: "Description",
      stock: 10,
      quantityType: "count",
    };

    await expect(useCase.execute(productData, mockRepo)).rejects.toThrow(
      ValidationError
    );
  });

  it("should throw ValidationError for whitespace-only name", async () => {
    const productData: Omit<Product, "id"> = {
      name: "   ",
      price: 10,
      category: "cat-1",
      description: "Description",
      stock: 10,
      quantityType: "count",
    };

    await expect(useCase.execute(productData, mockRepo)).rejects.toThrow(
      ValidationError
    );
  });

  it("should throw ValidationError for invalid price (zero)", async () => {
    const productData: Omit<Product, "id"> = {
      name: "Product",
      price: 0,
      category: "cat-1",
      description: "Description",
      stock: 10,
      quantityType: "count",
    };

    await expect(useCase.execute(productData, mockRepo)).rejects.toThrow(
      ValidationError
    );
  });

  it("should throw ValidationError for invalid price (negative)", async () => {
    const productData: Omit<Product, "id"> = {
      name: "Product",
      price: -10,
      category: "cat-1",
      description: "Description",
      stock: 10,
      quantityType: "count",
    };

    await expect(useCase.execute(productData, mockRepo)).rejects.toThrow(
      ValidationError
    );
  });

  it("should throw ValidationError for empty category", async () => {
    const productData: Omit<Product, "id"> = {
      name: "Product",
      price: 10,
      category: "",
      description: "Description",
      stock: 10,
      quantityType: "count",
    };

    await expect(useCase.execute(productData, mockRepo)).rejects.toThrow(
      ValidationError
    );
  });

  it("should throw ValidationError for negative stock", async () => {
    const productData: Omit<Product, "id"> = {
      name: "Product",
      price: 10,
      category: "cat-1",
      description: "Description",
      stock: -1,
      quantityType: "count",
    };

    await expect(useCase.execute(productData, mockRepo)).rejects.toThrow(
      ValidationError
    );
  });

  it("should allow zero stock", async () => {
    const productData: Omit<Product, "id"> = {
      name: "Product",
      price: 10,
      category: "cat-1",
      description: "Description",
      stock: 0,
      quantityType: "count",
    };

    await useCase.execute(productData, mockRepo);

    expect(mockRepo.create).toHaveBeenCalled();
  });
});
