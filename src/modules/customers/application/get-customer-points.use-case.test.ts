import { beforeEach, describe, expect, it, mock } from 'bun:test'
import {
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/presentation/errors'
import type { Customer } from '../domain/customer.entity'
import type { ICustomerRepository } from '../domain/customers.iface'
import { GetCustomerPointsUseCase } from './get-customer-points.use-case'

describe('GetCustomerPointsUseCase', () => {
  let useCase: GetCustomerPointsUseCase
  let mockRepo: ICustomerRepository

  beforeEach(() => {
    useCase = new GetCustomerPointsUseCase()
    mockRepo = {
      findByPhone: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Customer)),
      update: mock(() => Promise.resolve({} as Customer)),
      changePassword: mock(() => Promise.resolve({} as Customer)),
      upsert: mock(() => Promise.resolve({} as Customer)),
      getPointsInfo: mock(() => Promise.resolve(null)),
      findAll: mock(() => Promise.resolve([])),
    }
  })

  it('should return customer points info when found', async () => {
    const password = 'testPassword123'
    const passwordHash = await Bun.password.hash(password, 'argon2id')

    const mockCustomer: Customer = {
      phone: '1234567890',
      password: passwordHash,
      name: 'John Doe',
      address: '123 Main St',
      points: 150,
      totalSpent: '750.5',
      totalOrders: 8,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockRepo.findByPhone = mock(() => Promise.resolve(mockCustomer))

    const result = await useCase.execute(
      { phone: '1234567890', password },
      mockRepo,
    )

    expect(result.phone).toBe('1234567890')
    expect(result.points).toBe(150)
    expect(result.totalSpent).toBe(750.5)
    expect(result.totalOrders).toBe(8)
    expect(mockRepo.findByPhone).toHaveBeenCalledWith('1234567890')
  })

  it('should return points info with zero values', async () => {
    const password = 'testPassword123'
    const passwordHash = await Bun.password.hash(password, 'argon2id')

    const mockCustomer: Customer = {
      phone: '1234567890',
      password: passwordHash,
      name: null,
      address: null,
      points: 0,
      totalSpent: null,
      totalOrders: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockRepo.findByPhone = mock(() => Promise.resolve(mockCustomer))

    const result = await useCase.execute(
      { phone: '1234567890', password },
      mockRepo,
    )

    expect(result.phone).toBe('1234567890')
    expect(result.points).toBe(0)
    expect(result.totalSpent).toBe(0)
    expect(result.totalOrders).toBe(0)
  })

  it('should throw NotFoundError when customer not found', async () => {
    mockRepo.findByPhone = mock(() => Promise.resolve(null))

    await expect(
      useCase.execute(
        { phone: 'non-existent-phone', password: 'testPassword' },
        mockRepo,
      ),
    ).rejects.toThrow(NotFoundError)

    expect(mockRepo.findByPhone).toHaveBeenCalledWith('non-existent-phone')
  })

  it('should throw UnauthorizedError when password is invalid', async () => {
    const password = 'testPassword123'
    const passwordHash = await Bun.password.hash(password, 'argon2id')

    const mockCustomer: Customer = {
      phone: '1234567890',
      password: passwordHash,
      name: 'John Doe',
      address: null,
      points: 100,
      totalSpent: '500.00',
      totalOrders: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockRepo.findByPhone = mock(() => Promise.resolve(mockCustomer))

    await expect(
      useCase.execute(
        { phone: '1234567890', password: 'wrongPassword' },
        mockRepo,
      ),
    ).rejects.toThrow(UnauthorizedError)
  })

  it('should return points info with high values', async () => {
    const password = 'testPassword123'
    const passwordHash = await Bun.password.hash(password, 'argon2id')

    const mockCustomer: Customer = {
      phone: '1234567890',
      password: passwordHash,
      name: 'John Doe',
      address: null,
      points: 10000,
      totalSpent: '50000.99',
      totalOrders: 500,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockRepo.findByPhone = mock(() => Promise.resolve(mockCustomer))

    const result = await useCase.execute(
      { phone: '1234567890', password },
      mockRepo,
    )

    expect(result.points).toBe(10000)
    expect(result.totalSpent).toBe(50000.99)
    expect(result.totalOrders).toBe(500)
  })
})
