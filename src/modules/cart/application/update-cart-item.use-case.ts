import type { ICartRepository } from "../domain/cart.iface";
import type { IProductRepository } from "../../products/domain/products.iface";
import type { CartItemEntity } from "../domain/cart.entity";
import {
  BadRequestError,
  NotFoundError,
} from "../../../shared/presentation/errors";

export class UpdateCartItemUseCase {
  async execute(
    cartItemId: string,
    quantity: number,
    cartRepo: ICartRepository,
    productRepo: IProductRepository
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

    // Get cart item
    const cartItem = await cartRepo.findItemById(cartItemId);
    if (!cartItem) {
      throw new NotFoundError([
        {
          path: "cartItem",
          message: "Cart item not found",
        },
      ]);
    }

    // Validate product exists and is in stock
    const product = await productRepo.findById(cartItem.productId);
    if (!product) {
      throw new NotFoundError([
        {
          path: "product",
          message: "Product not found",
        },
      ]);
    }

    // Check stock availability
    if (product.stock < quantity) {
      throw new BadRequestError([
        {
          path: "quantity",
          message: `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`,
        },
      ]);
    }

    // Update item quantity
    return await cartRepo.updateItemQuantity(cartItemId, quantity);
  }
}
