import { BadRequestError } from "../../../shared/presentation/errors";
import type { IProductRepository } from "../../products/domain/products.iface";
import type { CartItemEntity } from "../domain/cart.entity";
import type { ICartRepository } from "../domain/cart.iface";

export class AddItemToCartUseCase {
	async execute(
		customerPhone: string,
		productId: string,
		quantity: number,
		cartRepo: ICartRepository,
		productRepo: IProductRepository,
	): Promise<CartItemEntity> {
		// Validate quantity
		if (quantity <= 0) {
			throw new BadRequestError([
				{
					path: "quantity",
					message: "Quantity must be greater than 0",
				},
			]);
		}

		// Validate product exists and is in stock
		const product = await productRepo.findById(productId);
		if (!product) {
			throw new BadRequestError([
				{
					path: "productId",
					message: "Product not found",
				},
			]);
		}

		// Get or create cart
		let cart = await cartRepo.findByCustomerPhone(customerPhone);
		if (!cart) {
			cart = await cartRepo.create(customerPhone);
		}

		// Check stock availability
		const existingItem = await cartRepo.findItemByCartAndProduct(
			cart.id,
			productId,
		);
		const currentQuantity = existingItem ? existingItem.quantity : 0;
		const newQuantity = currentQuantity + quantity;

		if (product.stock < newQuantity) {
			throw new BadRequestError([
				{
					path: "quantity",
					message: `Insufficient stock. Available: ${product.stock}, Requested: ${newQuantity}`,
				},
			]);
		}

		// Add item to cart
		return await cartRepo.addItem(cart.id, productId, quantity);
	}
}
