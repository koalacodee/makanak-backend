import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import type { Attachment, IAttachmentRepository } from '@/shared/attachments'
import filehub from '@/shared/filehub'
import { ValidationError } from '../../../shared/presentation/errors'
import type { Order, OrderCancellation } from '../domain/order.entity'
import type { IOrderRepository } from '../domain/orders.iface'
import { GetOrdersUseCase } from './get-orders.use-case'

describe('GetOrdersUseCase', () => {
  let useCase: GetOrdersUseCase
  let mockOrderRepo: IOrderRepository
  let mockAttachmentRepo: IAttachmentRepository
  let originalGetSignedUrlBatch: typeof filehub.getSignedUrlBatch

  beforeEach(() => {
    useCase = new GetOrdersUseCase()
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
    mockAttachmentRepo = {
      findById: mock(() => Promise.resolve(null)),
      findByTargetId: mock(() => Promise.resolve([])),
      findByTargetIds: mock(() => Promise.resolve([])),
      create: mock(() => Promise.resolve({} as Attachment)),
      update: mock(() => Promise.resolve({} as Attachment)),
      delete: mock(() => Promise.resolve()),
      deleteByTargetId: mock(() => Promise.resolve()),
    }
    originalGetSignedUrlBatch = filehub.getSignedUrlBatch
    filehub.getSignedUrlBatch = mock(() =>
      Promise.resolve([]),
    ) as typeof filehub.getSignedUrlBatch
  })

  afterEach(() => {
    filehub.getSignedUrlBatch = originalGetSignedUrlBatch
  })

  it('should return orders with pagination', async () => {
    const mockOrder: Order = {
      id: 'order-1',
      customerName: 'John Doe',
      phone: '1234567890',
      address: '123 Main St',
      orderItems: [],
      total: 100,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    mockOrderRepo.findAll = mock(() =>
      Promise.resolve({ data: [mockOrder], total: 1 }),
    )
    mockAttachmentRepo.findByTargetIds = mock(() => Promise.resolve([]))
    filehub.getSignedUrlBatch = mock(() => Promise.resolve([]))

    const result = await useCase.execute(
      { page: 1, limit: 20 },
      mockOrderRepo,
      mockAttachmentRepo,
    )

    expect(result.data).toHaveLength(1)
    expect(result.data[0].id).toBe('order-1')
    expect(result.pagination.page).toBe(1)
    expect(result.pagination.limit).toBe(20)
    expect(result.pagination.total).toBe(1)
    expect(result.pagination.totalPages).toBe(1)
  })

  it('should use default pagination values', async () => {
    mockAttachmentRepo.findByTargetIds = mock(() => Promise.resolve([]))
    filehub.getSignedUrlBatch = mock(() => Promise.resolve([]))

    await useCase.execute({}, mockOrderRepo, mockAttachmentRepo)

    expect(mockOrderRepo.findAll).toHaveBeenCalledWith({
      status: undefined,
      driverId: undefined,
      page: 1,
      limit: 20,
      search: undefined,
    })
  })

  it('should filter by status', async () => {
    mockAttachmentRepo.findByTargetIds = mock(() => Promise.resolve([]))
    filehub.getSignedUrlBatch = mock(() => Promise.resolve([]))

    await useCase.execute(
      { status: 'pending' },
      mockOrderRepo,
      mockAttachmentRepo,
    )

    expect(mockOrderRepo.findAll).toHaveBeenCalledWith({
      status: 'pending',
      driverId: undefined,
      page: 1,
      limit: 20,
      search: undefined,
    })
  })

  it('should filter by driverId', async () => {
    mockAttachmentRepo.findByTargetIds = mock(() => Promise.resolve([]))
    filehub.getSignedUrlBatch = mock(() => Promise.resolve([]))

    await useCase.execute(
      { driverId: 'driver-1' },
      mockOrderRepo,
      mockAttachmentRepo,
    )

    expect(mockOrderRepo.findAll).toHaveBeenCalledWith({
      status: undefined,
      driverId: 'driver-1',
      page: 1,
      limit: 20,
      search: undefined,
    })
  })

  it('should calculate totalPages correctly', async () => {
    mockOrderRepo.findAll = mock(() => Promise.resolve({ data: [], total: 50 }))
    mockAttachmentRepo.findByTargetIds = mock(() => Promise.resolve([]))
    filehub.getSignedUrlBatch = mock(() => Promise.resolve([]))

    const result = await useCase.execute(
      { page: 1, limit: 20 },
      mockOrderRepo,
      mockAttachmentRepo,
    )

    expect(result.pagination.totalPages).toBe(3)
  })

  it('should throw ValidationError for invalid page', async () => {
    await expect(
      useCase.execute({ page: 0 }, mockOrderRepo, mockAttachmentRepo),
    ).rejects.toThrow(ValidationError)
  })

  it('should throw ValidationError for invalid limit (too low)', async () => {
    await expect(
      useCase.execute({ limit: 0 }, mockOrderRepo, mockAttachmentRepo),
    ).rejects.toThrow(ValidationError)
  })

  it('should throw ValidationError for invalid limit (too high)', async () => {
    await expect(
      useCase.execute({ limit: 101 }, mockOrderRepo, mockAttachmentRepo),
    ).rejects.toThrow(ValidationError)
  })
})
