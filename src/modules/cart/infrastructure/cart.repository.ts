import { and, eq } from "drizzle-orm";
import type db from "../../../drizzle";
import {
	cartItems,
	carts,
	categories,
	products,
} from "../../../drizzle/schema";
import type { Cart, CartItemEntity } from "../domain/cart.entity";
import type { ICartRepository } from "../domain/cart.iface";

export class CartRepository implements ICartRepository {
	constructor(private database: typeof db) {}

	async findByCustomerPhone(customerPhone: string): Promise<Cart | null> {
		const result = await this.database
			.select()
			.from(carts)
			.where(eq(carts.customerPhone, customerPhone))
			.limit(1);

		if (result.length === 0) {
			return null;
		}

		const items = await this.fetchCartItems(result[0].id);
		return this.mapToEntity(result[0], items);
	}

	async create(customerPhone: string): Promise<Cart> {
		const cartId = Bun.randomUUIDv7();

		const [result] = await this.database
			.insert(carts)
			.values({
				id: cartId,
				customerPhone,
			})
			.returning();

		return this.mapToEntity(result, []);
	}

	async addItem(
		cartId: string,
		productId: string,
		quantity: number,
	): Promise<CartItemEntity> {
		// Check if item already exists in cart
		const existingItem = await this.findItemByCartAndProduct(cartId, productId);

		if (existingItem) {
			// Update quantity
			return await this.updateItemQuantity(
				existingItem.id,
				existingItem.quantity + quantity,
			);
		}

		// Create new cart item
		const cartItemId = Bun.randomUUIDv7();
		await this.database.insert(cartItems).values({
			id: cartItemId,
			cartId,
			productId,
			quantity,
		});

		// Update cart updatedAt
		await this.database
			.update(carts)
			.set({ updatedAt: new Date() })
			.where(eq(carts.id, cartId));

		// Fetch and return the item with product details
		const item = await this.findItemById(cartItemId);
		if (!item) {
			throw new Error("Failed to create cart item");
		}
		return item;
	}

	async updateItemQuantity(
		cartItemId: string,
		quantity: number,
	): Promise<CartItemEntity> {
		await this.database
			.update(cartItems)
			.set({ quantity })
			.where(eq(cartItems.id, cartItemId));

		// Update cart updatedAt
		const cartItem = await this.database
			.select({ cartId: cartItems.cartId })
			.from(cartItems)
			.where(eq(cartItems.id, cartItemId))
			.limit(1);

		if (cartItem.length > 0) {
			await this.database
				.update(carts)
				.set({ updatedAt: new Date() })
				.where(eq(carts.id, cartItem[0].cartId));
		}

		const item = await this.findItemById(cartItemId);
		if (!item) {
			throw new Error("Cart item not found");
		}
		return item;
	}

	async removeItem(cartItemId: string): Promise<void> {
		// Get cartId before deleting
		const cartItem = await this.database
			.select({ cartId: cartItems.cartId })
			.from(cartItems)
			.where(eq(cartItems.id, cartItemId))
			.limit(1);

		await this.database.delete(cartItems).where(eq(cartItems.id, cartItemId));

		// Update cart updatedAt
		if (cartItem.length > 0) {
			await this.database
				.update(carts)
				.set({ updatedAt: new Date() })
				.where(eq(carts.id, cartItem[0].cartId));
		}
	}

	async clearCart(cartId: string): Promise<void> {
		await this.database.delete(cartItems).where(eq(cartItems.cartId, cartId));
		await this.database
			.update(carts)
			.set({ updatedAt: new Date() })
			.where(eq(carts.id, cartId));
	}

	async findItemByCartAndProduct(
		cartId: string,
		productId: string,
	): Promise<CartItemEntity | null> {
		const result = await this.database
			.select({
				cartItem: cartItems,
				product: products,
				category: categories,
			})
			.from(cartItems)
			.innerJoin(products, eq(cartItems.productId, products.id))
			.leftJoin(categories, eq(products.categoryId, categories.id))
			.where(
				and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)),
			)
			.limit(1);

		if (result.length === 0) {
			return null;
		}

		return this.mapItemToEntity(
			result[0].cartItem,
			result[0].product,
			result[0].category,
		);
	}

	async findItemById(cartItemId: string): Promise<CartItemEntity | null> {
		const result = await this.database
			.select({
				cartItem: cartItems,
				product: products,
				category: categories,
			})
			.from(cartItems)
			.innerJoin(products, eq(cartItems.productId, products.id))
			.leftJoin(categories, eq(products.categoryId, categories.id))
			.where(eq(cartItems.id, cartItemId))
			.limit(1);

		if (result.length === 0) {
			return null;
		}

		return this.mapItemToEntity(
			result[0].cartItem,
			result[0].product,
			result[0].category,
		);
	}

	private async fetchCartItems(cartId: string): Promise<CartItemEntity[]> {
		const items = await this.database
			.select({
				cartItem: cartItems,
				product: products,
				category: categories,
			})
			.from(cartItems)
			.innerJoin(products, eq(cartItems.productId, products.id))
			.leftJoin(categories, eq(products.categoryId, categories.id))
			.where(eq(cartItems.cartId, cartId));

		return items.map((item) =>
			this.mapItemToEntity(item.cartItem, item.product, item.category),
		);
	}

	private mapItemToEntity(
		cartItem: typeof cartItems.$inferSelect,
		product: typeof products.$inferSelect,
		category: typeof categories.$inferSelect | null,
	): CartItemEntity {
		return {
			id: cartItem.id,
			productId: product.id,
			quantity: cartItem.quantity,
			product: {
				id: product.id,
				name: product.name,
				price: parseFloat(product.price || "0"),
				unit: product.unit,
				categoryId: product.categoryId,
				category: category
					? {
							id: category.id,
							name: category.name,
						}
					: undefined,
				image: product.image,
				description: product.description,
				stock: product.stock,
				originalPrice: product.originalPrice
					? parseFloat(product.originalPrice)
					: null,
			},
		};
	}

	private mapToEntity(
		row: typeof carts.$inferSelect,
		items: CartItemEntity[],
	): Cart {
		return {
			id: row.id,
			customerPhone: row.customerPhone,
			items,
			createdAt: row.createdAt || new Date(),
			updatedAt: row.updatedAt || new Date(),
		};
	}
}
