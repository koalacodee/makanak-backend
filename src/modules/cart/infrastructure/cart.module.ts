import { Elysia } from "elysia";
import db from "../../../drizzle";
import { CartRepository } from "./cart.repository";
import { ProductRepository } from "../../products/infrastructure/product.repository";
import { OrderRepository } from "../../orders/infrastructure/order.repository";
import { CustomerRepository } from "../../customers/infrastructure/customer.repository";
import { GetCartUseCase } from "../application/get-cart.use-case";
import { AddItemToCartUseCase } from "../application/add-item-to-cart.use-case";
import { UpdateCartItemUseCase } from "../application/update-cart-item.use-case";
import { RemoveCartItemUseCase } from "../application/remove-cart-item.use-case";
import { ClearCartUseCase } from "../application/clear-cart.use-case";
import { BuyNowUseCase } from "../application/buy-now.use-case";

export const cartModule = new Elysia({ name: "cartModule" })
  .decorate("cartRepo", new CartRepository(db))
  .decorate("productRepo", new ProductRepository(db))
  .decorate("orderRepo", new OrderRepository(db))
  .decorate("customerRepo", new CustomerRepository(db))
  .decorate("getCartUC", new GetCartUseCase())
  .decorate("addItemToCartUC", new AddItemToCartUseCase())
  .decorate("updateCartItemUC", new UpdateCartItemUseCase())
  .decorate("removeCartItemUC", new RemoveCartItemUseCase())
  .decorate("clearCartUC", new ClearCartUseCase())
  .decorate("buyNowUC", new BuyNowUseCase());
