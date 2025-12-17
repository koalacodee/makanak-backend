import { describe, it, expect, beforeEach, mock } from "bun:test";
import { CreateProductUseCase } from "./create-product.use-case";
import type { IProductRepository } from "../domain/products.iface";
import type { Product } from "../domain/product.entity";
import { ValidationError } from "../../../shared/presentation/errors";

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
          price: "10.00",
          unit: "kg",
          category: "cat-1",
          image: "https://example.com/img.jpg",
          description: "Description",
          stock: 10,
        })
      ),
      update: mock(() => Promise.resolve({} as Product)),
      delete: mock(() => Promise.resolve()),
    };
  });

  it("should create a product successfully", async () => {
    const productData: Omit<Product, "id"> = {
      name: "New Product",
      price: "10.00",
      unit: "kg",
      category: "cat-1",
      image: "https://example.com/img.jpg",
      description: "Description",
      stock: 10,
    };

    const result = await useCase.execute(productData, mockRepo);

    expect(result.id).toBe("new-id");
    expect(mockRepo.create).toHaveBeenCalledWith(productData);
  });

  it("should throw ValidationError for empty name", async () => {
    const productData: Omit<Product, "id"> = {
      name: "",
      price: "10.00",
      unit: "kg",
      category: "cat-1",
      image: "https://example.com/img.jpg",
      description: "Description",
      stock: 10,
    };

    await expect(useCase.execute(productData, mockRepo)).rejects.toThrow(
      ValidationError
    );
  });

  it("should throw ValidationError for whitespace-only name", async () => {
    const productData: Omit<Product, "id"> = {
      name: "   ",
      price: "10.00",
      unit: "kg",
      category: "cat-1",
      image: "https://example.com/img.jpg",
      description: "Description",
      stock: 10,
    };

    await expect(useCase.execute(productData, mockRepo)).rejects.toThrow(
      ValidationError
    );
  });

  it("should throw ValidationError for invalid price (zero)", async () => {
    const productData: Omit<Product, "id"> = {
      name: "Product",
      price: "0",
      unit: "kg",
      category: "cat-1",
      image: "https://example.com/img.jpg",
      description: "Description",
      stock: 10,
    };

    await expect(useCase.execute(productData, mockRepo)).rejects.toThrow(
      ValidationError
    );
  });

  it("should throw ValidationError for invalid price (negative)", async () => {
    const productData: Omit<Product, "id"> = {
      name: "Product",
      price: "-10.00",
      unit: "kg",
      category: "cat-1",
      image: "https://example.com/img.jpg",
      description: "Description",
      stock: 10,
    };

    await expect(useCase.execute(productData, mockRepo)).rejects.toThrow(
      ValidationError
    );
  });

  it("should throw ValidationError for empty unit", async () => {
    const productData: Omit<Product, "id"> = {
      name: "Product",
      price: "10.00",
      unit: "",
      category: "cat-1",
      image: "https://example.com/img.jpg",
      description: "Description",
      stock: 10,
    };

    await expect(useCase.execute(productData, mockRepo)).rejects.toThrow(
      ValidationError
    );
  });

  it("should throw ValidationError for empty category", async () => {
    const productData: Omit<Product, "id"> = {
      name: "Product",
      price: "10.00",
      unit: "kg",
      category: "",
      image: "https://example.com/img.jpg",
      description: "Description",
      stock: 10,
    };

    await expect(useCase.execute(productData, mockRepo)).rejects.toThrow(
      ValidationError
    );
  });

  it("should throw ValidationError for empty image", async () => {
    const productData: Omit<Product, "id"> = {
      name: "Product",
      price: "10.00",
      unit: "kg",
      category: "cat-1",
      image: "",
      description: "Description",
      stock: 10,
    };

    await expect(useCase.execute(productData, mockRepo)).rejects.toThrow(
      ValidationError
    );
  });

  it("should throw ValidationError for negative stock", async () => {
    const productData: Omit<Product, "id"> = {
      name: "Product",
      price: "10.00",
      unit: "kg",
      category: "cat-1",
      image: "https://example.com/img.jpg",
      description: "Description",
      stock: -1,
    };

    await expect(useCase.execute(productData, mockRepo)).rejects.toThrow(
      ValidationError
    );
  });

  it("should allow zero stock", async () => {
    const productData: Omit<Product, "id"> = {
      name: "Product",
      price: "10.00",
      unit: "kg",
      category: "cat-1",
      image: "https://example.com/img.jpg",
      description: "Description",
      stock: 0,
    };

    await useCase.execute(productData, mockRepo);

    expect(mockRepo.create).toHaveBeenCalled();
  });
});

