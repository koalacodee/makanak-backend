import cors from '@elysiajs/cors'
import openapi from '@elysiajs/openapi'
import { Elysia } from 'elysia'
import { authController } from './modules/auth'
import { cartController } from './modules/cart'
import { categoriesController } from './modules/categories'
import { couponController } from './modules/coupons'
import { customersController } from './modules/customers'
import { driversController } from './modules/drivers'
import { ordersController } from './modules/orders'
import { overviewController } from './modules/overview'
import { productsController } from './modules/products'
import { settingsController } from './modules/settings'
import { staffController } from './modules/staff'
import { suppliersController } from './modules/suppliers'
import { fileHubWebHookController } from './shared/filehub/webhook.controller'
import {
  errorDefinitions,
  errorHandler,
  onErrorHandler,
} from './shared/presentation/error-handler'

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
  : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174']

export const app = new Elysia()
  .error(errorDefinitions)
  .onError(({ error, set, code }) => onErrorHandler({ error, set, code }))
  .use(
    cors({
      credentials: true,
      origin: (request) => {
        const origin = request.headers.get('origin')
        if (!origin) return false
        return allowedOrigins.includes(origin) || allowedOrigins.includes('*')
      },
    }),
  )
  // .use(
  //   rateLimit({
  //     duration: 60 * 1000,
  //     max: 100,
  //     context: new RedisContext(),
  //   })
  // )
  .get('/', () => ({
    name: 'Makanak API',
    version: '1.0.0',
    description: 'Grocery E-Commerce API',
  }))
  .group('/v1', (app) =>
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
          path: 'openapi',
          documentation: {
            info: {
              title: 'Elysia Documentation',
              version: '1.0.0',
            },
          },
        }),
      ),
  )
