import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import type { Coupon } from '@/modules/coupons/domain/coupon.entity'
import type { Customer } from '@/modules/customers/domain/customer.entity'
import type { Product } from '@/modules/products/domain/product.entity'
import redis from '@/shared/redis'
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/presentation/errors'
import type { ICouponRepository } from '../../coupons/domain/coupon.iface'
import type { ICustomerRepository } from '../../customers/domain/customers.iface'
import type { ChangeOrderStatusUseCase } from '../../orders/application/change-order-status.use-case'
import type { Order, OrderCancellation } from '../../orders/domain/order.entity'
import type { IOrderRepository } from '../../orders/domain/orders.iface'
import type { IProductRepository } from '../../products/domain/products.iface'
import { CancelOrderUseCase } from './cancel-order.use-case'
import type { MarkAsReadyUseCase } from './mark-as-ready.use-case'

describe('CancelOrderUseCase', () => {
  let useCase: CancelOrderUseCase
  let mockOrderRepo: IOrderRepository
  let mockProductRepo: IProductRepository
  let mockCouponRepo: ICouponRepository
  let mockCustomerRepo: ICustomerRepository
  let mockChangeOrderStatusUC: ChangeOrderStatusUseCase
  let mockMarkAsReadyUC: MarkAsReadyUseCase
  let originalSrem: typeof redis.srem
  let originalRpush: typeof redis.rpush

  beforeEach(() => {
    useCase = new CancelOrderUseCase()
    mockOrderRepo = {
      findAll: mock(() => Promise.resolve({ data: [], total: 0 })),
      findById: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Order)),
      update: mock(() => Promise.resolve({} as Order)),
      getReadyOrdersForDriver: mock(() =>
        Promise.resolve({ orders: [], counts: [] }),
      ),
      count: mock(() => Promise.resolve(0)),
      saveCancellation: mock(() => Promise.resolve({} as OrderCancellation)),
    }
    mockProductRepo = {
      findAll: mock(() => Promise.resolve({ data: [], total: 0 })),
      findById: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Product)),
      update: mock(() => Promise.resolve({} as Product)),
      delete: mock(() => Promise.resolve()),
      findByIds: mock(() => Promise.resolve([])),
      existsByIds: mock(() => Promise.resolve(false)),
      updateStock: mock(() => Promise.resolve()),
      updateStockMany: mock(() => Promise.resolve()),
    }
    mockCouponRepo = {
      findAll: mock(() => Promise.resolve([])),
      findById: mock(() => Promise.resolve(null)),
      findByName: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Coupon)),
      update: mock(() => Promise.resolve({} as Coupon)),
      delete: mock(() => Promise.resolve()),
    }
    mockCustomerRepo = {
      findByPhone: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Customer)),
      update: mock(() => Promise.resolve({} as Customer)),
      changePassword: mock(() => Promise.resolve({} as Customer)),
      upsert: mock(() => Promise.resolve({} as Customer)),
      getPointsInfo: mock(() => Promise.resolve(null)),
      findAll: mock(() => Promise.resolve([])),
    }
    mockChangeOrderStatusUC = {
      execute: mock(() =>
        Promise.resolve({ order: {} as Order, cancellationPutUrl: undefined }),
      ),
      handleDeliveredStatus: mock(() => Promise.resolve()),
      handleCancelledStatus: mock(() => Promise.resolve()),
    } as unknown as ChangeOrderStatusUseCase
    mockMarkAsReadyUC = {} as MarkAsReadyUseCase
    originalSrem = redis.srem
    originalRpush = redis.rpush
    redis.srem = mock(() => Promise.resolve(1)) as typeof redis.srem
    redis.rpush = mock(() => Promise.resolve(1)) as typeof redis.rpush
  })

  afterEach(() => {
    redis.srem = originalSrem
    redis.rpush = originalRpush
  })

  it('should cancel order successfully', async () => {
    const mockOrder: Order = {
      id: 'order-1',
      customerName: 'John Doe',
      phone: '1234567890',
      address: '123 Main St',
      orderItems: [],
      total: 100,
      status: 'out_for_delivery',
      driverId: 'driver-1',
      createdAt: new Date().toISOString(),
    }

    const cancelledOrder: Order = {
      ...mockOrder,
      status: 'cancelled',
    }

    mockOrderRepo.findById = mock(() => Promise.resolve(mockOrder))
    mockChangeOrderStatusUC.execute = mock(() =>
      Promise.resolve({ order: cancelledOrder, cancellationPutUrl: undefined }),
    ) as unknown as ChangeOrderStatusUseCase['execute']

    const result = await useCase.execute(
      'order-1',
      'driver-1',
      { reason: 'Customer cancelled' },
      mockOrderRepo,
      mockProductRepo,
      mockCouponRepo,
      mockCustomerRepo,
      mockChangeOrderStatusUC,
      mockMarkAsReadyUC,
    )

    expect(result.order.status).toBe('cancelled')
    expect(mockOrderRepo.findById).toHaveBeenCalledWith('order-1')
    expect(mockChangeOrderStatusUC.execute).toHaveBeenCalledWith(
      {
        id: 'order-1',
        status: 'cancelled',
        cancellation: { reason: 'Customer cancelled' },
      },
      mockOrderRepo,
      mockCustomerRepo,
      mockProductRepo,
      mockCouponRepo,
      mockMarkAsReadyUC,
    )
    expect(redis.srem).toHaveBeenCalledWith('busy_drivers', 'driver-1')
    expect(redis.rpush).toHaveBeenCalledWith('available_drivers', 'driver-1')
  })

  it('should throw NotFoundError when order not found', async () => {
    mockOrderRepo.findById = mock(() => Promise.resolve(null))

    await expect(
      useCase.execute(
        'non-existent',
        'driver-1',
        { reason: 'Test' },
        mockOrderRepo,
        mockProductRepo,
        mockCouponRepo,
        mockCustomerRepo,
        mockChangeOrderStatusUC,
        mockMarkAsReadyUC,
      ),
    ).rejects.toThrow(NotFoundError)

    expect(redis.srem).not.toHaveBeenCalled()
    expect(redis.rpush).not.toHaveBeenCalled()
  })

  it('should throw UnauthorizedError when order is not assigned to driver', async () => {
    const mockOrder: Order = {
      id: 'order-1',
      customerName: 'John Doe',
      phone: '1234567890',
      address: '123 Main St',
      orderItems: [],
      total: 100,
      status: 'out_for_delivery',
      driverId: 'driver-2',
      createdAt: new Date().toISOString(),
    }

    mockOrderRepo.findById = mock(() => Promise.resolve(mockOrder))

    await expect(
      useCase.execute(
        'order-1',
        'driver-1',
        { reason: 'Test' },
        mockOrderRepo,
        mockProductRepo,
        mockCouponRepo,
        mockCustomerRepo,
        mockChangeOrderStatusUC,
        mockMarkAsReadyUC,
      ),
    ).rejects.toThrow(UnauthorizedError)

    expect(redis.srem).not.toHaveBeenCalled()
    expect(redis.rpush).not.toHaveBeenCalled()
  })

  it('should throw BadRequestError when order status is not out_for_delivery', async () => {
    const mockOrder: Order = {
      id: 'order-1',
      customerName: 'John Doe',
      phone: '1234567890',
      address: '123 Main St',
      orderItems: [],
      total: 100,
      status: 'ready',
      driverId: 'driver-1',
      createdAt: new Date().toISOString(),
    }

    mockOrderRepo.findById = mock(() => Promise.resolve(mockOrder))

    await expect(
      useCase.execute(
        'order-1',
        'driver-1',
        { reason: 'Test' },
        mockOrderRepo,
        mockProductRepo,
        mockCouponRepo,
        mockCustomerRepo,
        mockChangeOrderStatusUC,
        mockMarkAsReadyUC,
      ),
    ).rejects.toThrow(BadRequestError)

    expect(redis.srem).not.toHaveBeenCalled()
    expect(redis.rpush).not.toHaveBeenCalled()
  })
})
