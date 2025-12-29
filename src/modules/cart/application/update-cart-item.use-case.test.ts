import { beforeEach, describe, expect, it, mock } from "bun:test";
import {
	BadRequestError,
	NotFoundError,
} from "../../../shared/presentation/errors";
import type { Product } from "../../products/domain/product.entity";
import type { IProductRepository } from "../../products/domain/products.iface";
import type { CartItemEntity } from "../domain/cart.entity";
import type { ICartRepository } from "../domain/cart.iface";
import { UpdateCartItemUseCase } from "./update-cart-item.use-case";

describe("UpdateCartItemUseCase", () => {
	let useCase: UpdateCartItemUseCase;
	let mockCartRepo: ICartRepository;
	let mockProductRepo: IProductRepository;

	beforeEach(() => {
		useCase = new UpdateCartItemUseCase();
		mockCartRepo = {
			findByCustomerPhone: mock(() => Promise.resolve(null)),
			create: mock(() => Promise.resolve({} as any)),
			addItem: mock(() => Promise.resolve({} as CartItemEntity)),
			updateItemQuantity: mock(() => Promise.resolve({} as CartItemEntity)),
			removeItem: mock(() => Promise.resolve()),
			clearCart: mock(() => Promise.resolve()),
			findItemByCartAndProduct: mock(() => Promise.resolve(null)),
			findItemById: mock(() => Promise.resolve(null)),
		};
		mockProductRepo = {
			findAll: mock(() => Promise.resolve({ data: [], total: 0 })),
			findById: mock(() => Promise.resolve(null)),
			create: mock(() => Promise.resolve({} as Product)),
			update: mock(() => Promise.resolve({} as Product)),
			delete: mock(() => Promise.resolve()),
		};
	});

	it("should update cart item quantity successfully", async () => {
		const mockCartItem: CartItemEntity = {
			id: "item-1",
			productId: "product-1",
			quantity: 2,
			product: {
				id: "product-1",
				name: "Product 1",
				price: 10,
				unit: "kg",
				categoryId: "cat-1",
				image: "https://example.com/img1.jpg",
				description: "Description 1",
				stock: 10,
				originalPrice: null,
			},
		};

		const mockProduct: Product = {
			id: "product-1",
			name: "Product 1",
			price: "10.00",
			unit: "kg",
			category: "cat-1",
			image: "https://example.com/img1.jpg",
			description: "Description 1",
			stock: 10,
		};

		const updatedItem: CartItemEntity = {
			...mockCartItem,
			quantity: 5,
		};

		mockCartRepo.findItemById = mock(() => Promise.resolve(mockCartItem));
		mockProductRepo.findById = mock(() => Promise.resolve(mockProduct));
		mockCartRepo.updateItemQuantity = mock(() => Promise.resolve(updatedItem));

		const result = await useCase.execute(
			"item-1",
			5,
			mockCartRepo,
			mockProductRepo,
		);

		expect(result).toEqual(updatedItem);
		expect(mockCartRepo.updateItemQuantity).toHaveBeenCalledWith("item-1", 5);
	});

	it("should throw BadRequestError for invalid quantity", async () => {
		await expect(
			useCase.execute("item-1", 0, mockCartRepo, mockProductRepo),
		).rejects.toThrow(BadRequestError);
	});

	it("should throw NotFoundError if cart item not found", async () => {
		mockCartRepo.findItemById = mock(() => Promise.resolve(null));

		await expect(
			useCase.execute("item-1", 5, mockCartRepo, mockProductRepo),
		).rejects.toThrow(NotFoundError);
	});

	it("should throw NotFoundError if product not found", async () => {
		const mockCartItem: CartItemEntity = {
			id: "item-1",
			productId: "product-1",
			quantity: 2,
			product: {
				id: "product-1",
				name: "Product 1",
				price: 10,
				unit: "kg",
				categoryId: "cat-1",
				image: "https://example.com/img1.jpg",
				description: "Description 1",
				stock: 10,
				originalPrice: null,
			},
		};

		mockCartRepo.findItemById = mock(() => Promise.resolve(mockCartItem));
		mockProductRepo.findById = mock(() => Promise.resolve(null));

		await expect(
			useCase.execute("item-1", 5, mockCartRepo, mockProductRepo),
		).rejects.toThrow(NotFoundError);
	});

	it("should throw BadRequestError for insufficient stock", async () => {
		const mockCartItem: CartItemEntity = {
			id: "item-1",
			productId: "product-1",
			quantity: 2,
			product: {
				id: "product-1",
				name: "Product 1",
				price: 10,
				unit: "kg",
				categoryId: "cat-1",
				image: "https://example.com/img1.jpg",
				description: "Description 1",
				stock: 5,
				originalPrice: null,
			},
		};

		const mockProduct: Product = {
			id: "product-1",
			name: "Product 1",
			price: "10.00",
			unit: "kg",
			category: "cat-1",
			image: "https://example.com/img1.jpg",
			description: "Description 1",
			stock: 5,
		};

		mockCartRepo.findItemById = mock(() => Promise.resolve(mockCartItem));
		mockProductRepo.findById = mock(() => Promise.resolve(mockProduct));

		await expect(
			useCase.execute("item-1", 10, mockCartRepo, mockProductRepo),
		).rejects.toThrow(BadRequestError);
	});
});
