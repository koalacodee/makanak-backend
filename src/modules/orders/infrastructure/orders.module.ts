import { Elysia } from "elysia";
import db from "../../../drizzle";
import { OrderRepository } from "./order.repository";
import { ProductRepository } from "../../products/infrastructure/product.repository";
import { CustomerRepository } from "../../customers/infrastructure/customer.repository";
import { SettingsRepository } from "../../settings/infrastructure/settings.repository";
import { StaffRepository } from "../../staff/infrastructure/staff.repository";
import { GetOrdersUseCase } from "../application/get-orders.use-case";
import { GetOrderUseCase } from "../application/get-order.use-case";
import { CreateOrderUseCase } from "../application/create-order.use-case";
import { AssignOrderToDriverUseCase } from "../application/assign-order-to-driver.use-case";
import { ChangeOrderStatusUseCase } from "../application/change-order-status.use-case";
import { AttachmentRepository } from "@/shared/attachments";
import { UpsertCustomerUseCase } from "@/modules/customers/application/upsert-customer.use-case";
import { MarkAsReadyUseCase } from "@/modules/drivers/application/mark-as-ready.use-case";

export const ordersModule = new Elysia({ name: "ordersModule" })
  .decorate("orderRepo", new OrderRepository(db))
  .decorate("productRepo", new ProductRepository(db))
  .decorate("customerRepo", new CustomerRepository(db))
  .decorate("settingsRepo", new SettingsRepository(db))
  .decorate("staffMemberRepo", new StaffRepository(db))
  .decorate("attachmentRepo", new AttachmentRepository(db))
  .decorate("getOrdersUC", new GetOrdersUseCase())
  .decorate("getOrderUC", new GetOrderUseCase())
  .decorate("createOrderUC", new CreateOrderUseCase())
  .decorate("assignOrderToDriverUC", new AssignOrderToDriverUseCase())
  .decorate("changeOrderStatusUC", new ChangeOrderStatusUseCase())
  .decorate("upsertCustomerUC", new UpsertCustomerUseCase())
  .decorate("markAsReadyUC", new MarkAsReadyUseCase());
