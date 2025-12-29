import type { Cart, CartItemEntity } from './cart.entity'

export interface ICartRepository {
  findByCustomerPhone(customerPhone: string): Promise<Cart | null>
  create(customerPhone: string): Promise<Cart>
  addItem(
    cartId: string,
    productId: string,
    quantity: number,
  ): Promise<CartItemEntity>
  updateItemQuantity(
    cartItemId: string,
    quantity: number,
  ): Promise<CartItemEntity>
  removeItem(cartItemId: string): Promise<void>
  clearCart(cartId: string): Promise<void>
  findItemByCartAndProduct(
    cartId: string,
    productId: string,
  ): Promise<CartItemEntity | null>
  findItemById(cartItemId: string): Promise<CartItemEntity | null>
}
