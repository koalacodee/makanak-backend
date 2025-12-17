import type { ICartRepository } from "../domain/cart.iface";
import { NotFoundError } from "../../../shared/presentation/errors";

export class ClearCartUseCase {
  async execute(
    customerPhone: string,
    cartRepo: ICartRepository
  ): Promise<void> {
    // Get cart
    const cart = await cartRepo.findByCustomerPhone(customerPhone);
    if (!cart) {
      throw new NotFoundError([
        {
          path: "cart",
          message: "Cart not found",
        },
      ]);
    }

    // Clear cart
    await cartRepo.clearCart(cart.id);
  }
}
