import { Elysia } from "elysia";
import db from "../../../drizzle";
import { CustomerRepository } from "./customer.repository";
import { GetCustomerUseCase } from "../application/get-customer.use-case";
import { UpsertCustomerUseCase } from "../application/upsert-customer.use-case";
import { UpdateCustomerUseCase } from "../application/update-customer.use-case";
import { GetCustomerPointsUseCase } from "../application/get-customer-points.use-case";

export const customersModule = new Elysia({ name: "customersModule" })
  .decorate("customerRepo", new CustomerRepository(db))
  .decorate("getCustomerUC", new GetCustomerUseCase())
  .decorate("upsertCustomerUC", new UpsertCustomerUseCase())
  .decorate("updateCustomerUC", new UpdateCustomerUseCase())
  .decorate("getCustomerPointsUC", new GetCustomerPointsUseCase());
