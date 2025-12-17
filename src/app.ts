import { Elysia } from "elysia";
import { errorHandler } from "./shared/presentation/error-handler";
import { authController } from "./modules/auth";
import { productsController } from "./modules/products";
import { categoriesController } from "./modules/categories";

export const app = new Elysia()
  .use(errorHandler)
  .get("/", () => ({
    name: "Makanak API",
    version: "1.0.0",
    description: "Grocery E-Commerce API",
  }))
  .group("/v1", (app) =>
    app.use(authController).use(productsController).use(categoriesController)
  );
