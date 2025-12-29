import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { UnauthorizedError } from '../../../shared/presentation/errors'
import type { Customer, CustomerInput } from '../domain/customer.entity'
import type { ICustomerRepository } from '../domain/customers.iface'
import { UpsertCustomerUseCase } from './upsert-customer.use-case'

describe('UpsertCustomerUseCase', () => {
  let useCase: UpsertCustomerUseCase
  let mockRepo: ICustomerRepository

  beforeEach(() => {
    useCase = new UpsertCustomerUseCase()
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

  it('should create new customer when not exists', async () => {
    const password = 'testPassword123'
    const passwordHash = await Bun.password.hash(password, 'argon2id')

    const newCustomer: Customer = {
      phone: '1234567890',
      password: passwordHash,
      name: 'John Doe',
      address: '123 Main St',
      points: 0,
      totalSpent: null,
      totalOrders: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const input: CustomerInput = {
      phone: '1234567890',
      password,
      name: 'John Doe',
      address: '123 Main St',
    }

    mockRepo.findByPhone = mock(() => Promise.resolve(null))
    mockRepo.create = mock(() => Promise.resolve(newCustomer))

    const result = await useCase.execute(input, mockRepo)

    expect(result.phone).toBe('1234567890')
    expect(result.name).toBe('John Doe')
    expect(mockRepo.findByPhone).toHaveBeenCalledWith('1234567890')
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: '1234567890',
        name: 'John Doe',
        address: '123 Main St',
        password: expect.stringContaining('$argon2id$'),
      }),
    )
  })

  it('should update existing customer', async () => {
    const password = 'testPassword123'
    const passwordHash = await Bun.password.hash(password, 'argon2id')

    const existingCustomer: Customer = {
      phone: '1234567890',
      password: passwordHash,
      name: 'John Doe',
      address: '123 Main St',
      points: 0,
      totalSpent: null,
      totalOrders: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }

    const updatedCustomer: Customer = {
      ...existingCustomer,
      name: 'Jane Doe',
      address: '456 Oak Ave',
      updatedAt: new Date(),
    }

    const input: CustomerInput = {
      phone: '1234567890',
      password,
      name: 'Jane Doe',
      address: '456 Oak Ave',
    }

    mockRepo.findByPhone = mock(() => Promise.resolve(existingCustomer))
    mockRepo.update = mock(() => Promise.resolve(updatedCustomer))

    const result = await useCase.execute(input, mockRepo)

    expect(result.name).toBe('Jane Doe')
    expect(result.address).toBe('456 Oak Ave')
    expect(mockRepo.findByPhone).toHaveBeenCalledWith('1234567890')
    expect(mockRepo.update).toHaveBeenCalledWith('1234567890', input)
  })

  it('should throw UnauthorizedError when password is invalid for existing customer', async () => {
    const password = 'testPassword123'
    const passwordHash = await Bun.password.hash(password, 'argon2id')

    const existingCustomer: Customer = {
      phone: '1234567890',
      password: passwordHash,
      name: 'John Doe',
      address: null,
      points: 0,
      totalSpent: null,
      totalOrders: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const input: CustomerInput = {
      phone: '1234567890',
      password: 'wrongPassword',
      name: 'John Doe',
    }

    mockRepo.findByPhone = mock(() => Promise.resolve(existingCustomer))

    await expect(useCase.execute(input, mockRepo)).rejects.toThrow(
      UnauthorizedError,
    )
    expect(mockRepo.update).not.toHaveBeenCalled()
  })

  it('should handle minimal input', async () => {
    const password = 'testPassword123'
    const passwordHash = await Bun.password.hash(password, 'argon2id')

    const newCustomer: Customer = {
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

    const input: CustomerInput = {
      phone: '1234567890',
      password,
    }

    mockRepo.findByPhone = mock(() => Promise.resolve(null))
    mockRepo.create = mock(() => Promise.resolve(newCustomer))

    const result = await useCase.execute(input, mockRepo)

    expect(result.phone).toBe('1234567890')
    expect(result.name).toBeNull()
    expect(mockRepo.create).toHaveBeenCalled()
  })
})
