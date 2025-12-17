import type { ICartRepository } from "../domain/cart.iface";
import type { Cart } from "../domain/cart.entity";

export class GetCartUseCase {
  async execute(
    customerPhone: string,
    cartRepo: ICartRepository
  ): Promise<Cart> {
    let cart = await cartRepo.findByCustomerPhone(customerPhone);

    // Create cart if it doesn't exist
    if (!cart) {
      cart = await cartRepo.create(customerPhone);
    }

    return cart;
  }
}
