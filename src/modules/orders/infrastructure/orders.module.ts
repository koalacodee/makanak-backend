import { Elysia } from 'elysia'
import { CouponRepository } from '@/modules/coupons/infrastructure/coupon.repository'
import { UpsertCustomerUseCase } from '@/modules/customers/application/upsert-customer.use-case'
import { MarkAsReadyUseCase } from '@/modules/drivers/application/mark-as-ready.use-case'
import { AttachmentRepository } from '@/shared/attachments'
import db from '../../../drizzle'
import { CustomerRepository } from '../../customers/infrastructure/customer.repository'
import { ProductRepository } from '../../products/infrastructure/product.repository'
import { SettingsRepository } from '../../settings/infrastructure/settings.repository'
import { StaffRepository } from '../../staff/infrastructure/staff.repository'
import { AssignOrderToDriverUseCase } from '../application/assign-order-to-driver.use-case'
import { CancelOrderByInventoryUseCase } from '../application/cancel-order-by-inventory.use-case'
import { ChangeOrderStatusUseCase } from '../application/change-order-status.use-case'
import { CreateOrderUseCase } from '../application/create-order.use-case'
import { GetOrderUseCase } from '../application/get-order.use-case'
import { GetOrdersUseCase } from '../application/get-orders.use-case'
import { OrderRepository } from './order.repository'

export const ordersModule = new Elysia({ name: 'ordersModule' })
  .decorate('orderRepo', new OrderRepository(db))
  .decorate('productRepo', new ProductRepository(db))
  .decorate('customerRepo', new CustomerRepository(db))
  .decorate('settingsRepo', new SettingsRepository(db))
  .decorate('staffMemberRepo', new StaffRepository(db))
  .decorate('attachmentRepo', new AttachmentRepository(db))
  .decorate('getOrdersUC', new GetOrdersUseCase())
  .decorate('getOrderUC', new GetOrderUseCase())
  .decorate('createOrderUC', new CreateOrderUseCase())
  .decorate('assignOrderToDriverUC', new AssignOrderToDriverUseCase())
  .decorate('changeOrderStatusUC', new ChangeOrderStatusUseCase())
  .decorate('cancelOrderByInventoryUC', new CancelOrderByInventoryUseCase())
  .decorate('upsertCustomerUC', new UpsertCustomerUseCase())
  .decorate('markAsReadyUC', new MarkAsReadyUseCase())
  .decorate('couponRepo', new CouponRepository(db))
