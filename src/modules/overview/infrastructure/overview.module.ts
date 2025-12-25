import { Elysia } from "elysia";
import db from "../../../drizzle";
import { OrderRepository } from "../../orders/infrastructure/order.repository";
import { CustomerRepository } from "../../customers/infrastructure/customer.repository";
import { StaffRepository } from "../../staff/infrastructure/staff.repository";
import { GetOverviewUseCase } from "../application/get-overview.use-case";
import { OverviewRepository } from "./overview.repository";

export const overviewModule = new Elysia({ name: "overviewModule" })
  .decorate("orderRepo", new OrderRepository(db))
  .decorate("customerRepo", new CustomerRepository(db))
  .decorate("staffRepo", new StaffRepository(db))
  .decorate("overviewRepo", new OverviewRepository(db))
  .decorate("getOverviewUC", new GetOverviewUseCase());
