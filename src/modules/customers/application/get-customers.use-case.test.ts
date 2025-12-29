import { beforeEach, describe, expect, it, mock } from 'bun:test'
import type { Customer } from '../domain/customer.entity'
import type { ICustomerRepository } from '../domain/customers.iface'
import type { GetCustomersListQuery } from '../presentation/customers.dto'
import { GetCustomersUseCase } from './get-customers.use-case'

describe('GetCustomersUseCase', () => {
  let useCase: GetCustomersUseCase
  let mockRepo: ICustomerRepository

  beforeEach(() => {
    useCase = new GetCustomersUseCase()
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

  it('should return all customers when no search query', async () => {
    const mockCustomers: Customer[] = [
      {
        phone: '1234567890',
        password: 'hash1',
        name: 'John Doe',
        address: '123 Main St',
        points: 100,
        totalSpent: '500.00',
        totalOrders: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        phone: '0987654321',
        password: 'hash2',
        name: 'Jane Smith',
        address: '456 Oak Ave',
        points: 50,
        totalSpent: '250.00',
        totalOrders: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    mockRepo.findAll = mock(() => Promise.resolve(mockCustomers))

    const query: GetCustomersListQuery = {}
    const result = await useCase.execute(query, mockRepo)

    expect(result).toEqual(mockCustomers)
    expect(result).toHaveLength(2)
    expect(mockRepo.findAll).toHaveBeenCalledWith({ search: undefined })
  })

  it('should return customers with search query', async () => {
    const mockCustomers: Customer[] = [
      {
        phone: '1234567890',
        password: 'hash1',
        name: 'John Doe',
        address: '123 Main St',
        points: 100,
        totalSpent: '500.00',
        totalOrders: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    mockRepo.findAll = mock(() => Promise.resolve(mockCustomers))

    const query: GetCustomersListQuery = { search: 'John' }
    const result = await useCase.execute(query, mockRepo)

    expect(result).toEqual(mockCustomers)
    expect(result).toHaveLength(1)
    expect(mockRepo.findAll).toHaveBeenCalledWith({ search: 'John' })
  })

  it('should return empty array when no customers exist', async () => {
    mockRepo.findAll = mock(() => Promise.resolve([]))

    const query: GetCustomersListQuery = {}
    const result = await useCase.execute(query, mockRepo)

    expect(result).toEqual([])
    expect(result).toHaveLength(0)
    expect(mockRepo.findAll).toHaveBeenCalledWith({ search: undefined })
  })

  it('should handle search query with empty string', async () => {
    const mockCustomers: Customer[] = [
      {
        phone: '1234567890',
        password: 'hash1',
        name: 'John Doe',
        address: null,
        points: 0,
        totalSpent: null,
        totalOrders: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    mockRepo.findAll = mock(() => Promise.resolve(mockCustomers))

    const query: GetCustomersListQuery = { search: '' }
    const result = await useCase.execute(query, mockRepo)

    expect(result).toEqual(mockCustomers)
    expect(mockRepo.findAll).toHaveBeenCalledWith({ search: '' })
  })

  it('should pass search query correctly to repository', async () => {
    const mockCustomers: Customer[] = []

    mockRepo.findAll = mock(() => Promise.resolve(mockCustomers))

    const query: GetCustomersListQuery = { search: 'test search' }
    await useCase.execute(query, mockRepo)

    expect(mockRepo.findAll).toHaveBeenCalledWith({ search: 'test search' })
  })

  it('should return customers with null fields', async () => {
    const mockCustomers: Customer[] = [
      {
        phone: '1234567890',
        password: 'hash1',
        name: null,
        address: null,
        points: 0,
        totalSpent: null,
        totalOrders: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    mockRepo.findAll = mock(() => Promise.resolve(mockCustomers))

    const query: GetCustomersListQuery = {}
    const result = await useCase.execute(query, mockRepo)

    expect(result).toHaveLength(1)
    expect(result[0].name).toBeNull()
    expect(result[0].address).toBeNull()
    expect(result[0].totalSpent).toBeNull()
    expect(result[0].totalOrders).toBeNull()
  })
})
