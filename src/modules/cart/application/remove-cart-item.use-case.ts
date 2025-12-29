import { NotFoundError } from '../../../shared/presentation/errors'
import type { ICartRepository } from '../domain/cart.iface'

export class RemoveCartItemUseCase {
  async execute(cartItemId: string, cartRepo: ICartRepository): Promise<void> {
    // Check if item exists
    const cartItem = await cartRepo.findItemById(cartItemId)
    if (!cartItem) {
      throw new NotFoundError([
        {
          path: 'cartItem',
          message: 'Cart item not found',
        },
      ])
    }

    // Remove item
    await cartRepo.removeItem(cartItemId)
  }
}
