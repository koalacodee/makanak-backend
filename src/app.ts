import { Elysia } from "elysia";
import {
  errorHandler,
  onErrorHandler,
  errorDefinitions,
} from "./shared/presentation/error-handler";
import { authController } from "./modules/auth";
import { productsController } from "./modules/products";
import { categoriesController } from "./modules/categories";
import { ordersController } from "./modules/orders";
import { staffController } from "./modules/staff";
import { suppliersController } from "./modules/suppliers";
import { settingsController } from "./modules/settings";
import { customersController } from "./modules/customers";
import { cartController } from "./modules/cart";
import { driversController } from "./modules/drivers";
import { overviewController } from "./modules/overview";
import { couponController } from "./modules/coupons";
import { fileHubWebHookController } from "./shared/filehub/webhook.controller";
import openapi from "@elysiajs/openapi";
import cors from "@elysiajs/cors";
import { rateLimit } from "elysia-rate-limit";
import { RedisContext } from "./shared/rate-limit";

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
  : ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"];

export const app = new Elysia()
  .error(errorDefinitions)
  .onError(onErrorHandler)
  .use(
    cors({
      credentials: true,
      origin: (request) => {
        const origin = request.headers.get("origin");
        if (!origin) return false;
        return allowedOrigins.includes(origin) || allowedOrigins.includes("*");
      },
    })
  )
  // .use(
  //   rateLimit({
  //     duration: 60 * 1000,
  //     max: 100,
  //     context: new RedisContext(),
  //   })
  // )
  .get("/", () => ({
    name: "Makanak API",
    version: "1.0.0",
    description: "Grocery E-Commerce API",
  }))
  .group("/v1", (app) =>
    app
      .use(errorHandler)
      .use(authController)
      .use(productsController)
      .use(categoriesController)
      .use(ordersController)
      .use(staffController)
      .use(suppliersController)
      .use(settingsController)
      .use(customersController)
      .use(cartController)
      .use(driversController)
      .use(overviewController)
      .use(couponController)
      .use(fileHubWebHookController)
      .use(
        openapi({
          path: "openapi",
          documentation: {
            info: {
              title: "Elysia Documentation",
              version: "1.0.0",
            },
          },
        })
      )
  );
