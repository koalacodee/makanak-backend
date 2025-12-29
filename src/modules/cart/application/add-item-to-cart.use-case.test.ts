import { beforeEach, describe, expect, it, mock } from "bun:test";
import { BadRequestError } from "../../../shared/presentation/errors";
import type { Product } from "../../products/domain/product.entity";
import type { IProductRepository } from "../../products/domain/products.iface";
import type { Cart, CartItemEntity } from "../domain/cart.entity";
import type { ICartRepository } from "../domain/cart.iface";
import { AddItemToCartUseCase } from "./add-item-to-cart.use-case";

describe("AddItemToCartUseCase", () => {
	let useCase: AddItemToCartUseCase;
	let mockCartRepo: ICartRepository;
	let mockProductRepo: IProductRepository;

	beforeEach(() => {
		useCase = new AddItemToCartUseCase();
		mockCartRepo = {
			findByCustomerPhone: mock(() => Promise.resolve(null)),
			create: mock(() => Promise.resolve({} as Cart)),
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

	it("should add item to cart successfully", async () => {
		const mockCart: Cart = {
			id: "cart-1",
			customerPhone: "1234567890",
			items: [],
			createdAt: new Date(),
			updatedAt: new Date(),
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

		mockCartRepo.findByCustomerPhone = mock(() => Promise.resolve(mockCart));
		mockProductRepo.findById = mock(() => Promise.resolve(mockProduct));
		mockCartRepo.findItemByCartAndProduct = mock(() => Promise.resolve(null));
		mockCartRepo.addItem = mock(() => Promise.resolve(mockCartItem));

		const result = await useCase.execute(
			"1234567890",
			"product-1",
			2,
			mockCartRepo,
			mockProductRepo,
		);

		expect(result).toEqual(mockCartItem);
		expect(mockCartRepo.addItem).toHaveBeenCalledWith("cart-1", "product-1", 2);
	});

	it("should create cart if it doesn't exist", async () => {
		const mockCart: Cart = {
			id: "cart-1",
			customerPhone: "1234567890",
			items: [],
			createdAt: new Date(),
			updatedAt: new Date(),
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

		mockCartRepo.findByCustomerPhone = mock(() => Promise.resolve(null));
		mockCartRepo.create = mock(() => Promise.resolve(mockCart));
		mockProductRepo.findById = mock(() => Promise.resolve(mockProduct));
		mockCartRepo.findItemByCartAndProduct = mock(() => Promise.resolve(null));
		mockCartRepo.addItem = mock(() => Promise.resolve(mockCartItem));

		await useCase.execute(
			"1234567890",
			"product-1",
			2,
			mockCartRepo,
			mockProductRepo,
		);

		expect(mockCartRepo.create).toHaveBeenCalledWith("1234567890");
	});

	it("should throw BadRequestError for invalid quantity", async () => {
		await expect(
			useCase.execute(
				"1234567890",
				"product-1",
				0,
				mockCartRepo,
				mockProductRepo,
			),
		).rejects.toThrow(BadRequestError);
	});

	it("should throw BadRequestError if product not found", async () => {
		mockProductRepo.findById = mock(() => Promise.resolve(null));

		await expect(
			useCase.execute(
				"1234567890",
				"product-1",
				2,
				mockCartRepo,
				mockProductRepo,
			),
		).rejects.toThrow(BadRequestError);
	});

	it("should throw BadRequestError for insufficient stock", async () => {
		const mockCart: Cart = {
			id: "cart-1",
			customerPhone: "1234567890",
			items: [],
			createdAt: new Date(),
			updatedAt: new Date(),
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

		mockCartRepo.findByCustomerPhone = mock(() => Promise.resolve(mockCart));
		mockProductRepo.findById = mock(() => Promise.resolve(mockProduct));
		mockCartRepo.findItemByCartAndProduct = mock(() => Promise.resolve(null));

		await expect(
			useCase.execute(
				"1234567890",
				"product-1",
				10,
				mockCartRepo,
				mockProductRepo,
			),
		).rejects.toThrow(BadRequestError);
	});

	it("should check total quantity when item already exists in cart", async () => {
		const mockCart: Cart = {
			id: "cart-1",
			customerPhone: "1234567890",
			items: [],
			createdAt: new Date(),
			updatedAt: new Date(),
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

		const existingItem: CartItemEntity = {
			id: "item-1",
			productId: "product-1",
			quantity: 8,
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

		mockCartRepo.findByCustomerPhone = mock(() => Promise.resolve(mockCart));
		mockProductRepo.findById = mock(() => Promise.resolve(mockProduct));
		mockCartRepo.findItemByCartAndProduct = mock(() =>
			Promise.resolve(existingItem),
		);

		// Trying to add 5 more when already 8 in cart (total 13) but stock is only 10
		await expect(
			useCase.execute(
				"1234567890",
				"product-1",
				5,
				mockCartRepo,
				mockProductRepo,
			),
		).rejects.toThrow(BadRequestError);
	});
});
