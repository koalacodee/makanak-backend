import { Elysia } from "elysia";
import db from "../../../drizzle";
import { OrderRepository } from "./order.repository";
import { GetOrdersUseCase } from "../application/get-orders.use-case";
import { GetOrderUseCase } from "../application/get-order.use-case";
import { CreateOrderUseCase } from "../application/create-order.use-case";
import { UpdateOrderUseCase } from "../application/update-order.use-case";

export const ordersModule = new Elysia({ name: "ordersModule" })
  .decorate("orderRepo", new OrderRepository(db))
  .decorate("getOrdersUC", new GetOrdersUseCase())
  .decorate("getOrderUC", new GetOrderUseCase())
  .decorate("createOrderUC", new CreateOrderUseCase())
  .decorate("updateOrderUC", new UpdateOrderUseCase());
