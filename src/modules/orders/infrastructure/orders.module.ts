import { Elysia } from "elysia";
import db from "../../../drizzle";
import { OrderRepository } from "./order.repository";
import { ProductRepository } from "../../products/infrastructure/product.repository";
import { CustomerRepository } from "../../customers/infrastructure/customer.repository";
import { SettingsRepository } from "../../settings/infrastructure/settings.repository";
import { GetOrdersUseCase } from "../application/get-orders.use-case";
import { GetOrderUseCase } from "../application/get-order.use-case";
import { CreateOrderUseCase } from "../application/create-order.use-case";
import { UpdateOrderUseCase } from "../application/update-order.use-case";

export const ordersModule = new Elysia({ name: "ordersModule" })
  .decorate("orderRepo", new OrderRepository(db))
  .decorate("productRepo", new ProductRepository(db))
  .decorate("customerRepo", new CustomerRepository(db))
  .decorate("settingsRepo", new SettingsRepository(db))
  .decorate("getOrdersUC", new GetOrdersUseCase())
  .decorate("getOrderUC", new GetOrderUseCase())
  .decorate("createOrderUC", new CreateOrderUseCase())
  .decorate("updateOrderUC", new UpdateOrderUseCase());
