import { beforeEach, describe, expect, it, mock } from 'bun:test'
import type { Supplier } from '../domain/supplier.entity'
import type { ISupplierRepository } from '../domain/suppliers.iface'
import { GetSuppliersUseCase } from './get-suppliers.use-case'

describe('GetSuppliersUseCase', () => {
  let useCase: GetSuppliersUseCase
  let mockRepo: ISupplierRepository

  beforeEach(() => {
    useCase = new GetSuppliersUseCase()
    mockRepo = {
      findAll: mock(() => Promise.resolve([])),
      findById: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Supplier)),
      update: mock(() => Promise.resolve({} as Supplier)),
      delete: mock(() => Promise.resolve()),
    }
  })

  it('should return all suppliers when no filters are provided', async () => {
    const mockSuppliers: Supplier[] = [
      {
        id: 'supplier-1',
        name: 'Supplier One',
        phone: '1234567890',
        category: 'groceries',
        companyName: 'Company One',
        notes: 'Notes one',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'supplier-2',
        name: 'Supplier Two',
        phone: '0987654321',
        category: 'beverages',
        companyName: null,
        notes: null,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    mockRepo.findAll = mock(() => Promise.resolve(mockSuppliers))

    const result = await useCase.execute(undefined, mockRepo)

    expect(result).toEqual(mockSuppliers)
    expect(mockRepo.findAll).toHaveBeenCalledWith(undefined)
  })

  it('should return filtered suppliers when status filter is provided', async () => {
    const mockSuppliers: Supplier[] = [
      {
        id: 'supplier-1',
        name: 'Supplier One',
        phone: '1234567890',
        category: 'groceries',
        companyName: null,
        notes: null,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    mockRepo.findAll = mock(() => Promise.resolve(mockSuppliers))

    const result = await useCase.execute({ status: 'active' }, mockRepo)

    expect(result).toEqual(mockSuppliers)
    expect(mockRepo.findAll).toHaveBeenCalledWith({ status: 'active' })
  })

  it('should return filtered suppliers when category filter is provided', async () => {
    const mockSuppliers: Supplier[] = [
      {
        id: 'supplier-1',
        name: 'Supplier One',
        phone: '1234567890',
        category: 'groceries',
        companyName: null,
        notes: null,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    mockRepo.findAll = mock(() => Promise.resolve(mockSuppliers))

    const result = await useCase.execute({ category: 'groceries' }, mockRepo)

    expect(result).toEqual(mockSuppliers)
    expect(mockRepo.findAll).toHaveBeenCalledWith({ category: 'groceries' })
  })

  it('should return filtered suppliers when both filters are provided', async () => {
    const mockSuppliers: Supplier[] = [
      {
        id: 'supplier-1',
        name: 'Supplier One',
        phone: '1234567890',
        category: 'groceries',
        companyName: null,
        notes: null,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    mockRepo.findAll = mock(() => Promise.resolve(mockSuppliers))

    const result = await useCase.execute(
      { status: 'active', category: 'groceries' },
      mockRepo,
    )

    expect(result).toEqual(mockSuppliers)
    expect(mockRepo.findAll).toHaveBeenCalledWith({
      status: 'active',
      category: 'groceries',
    })
  })

  it('should return empty array when no suppliers exist', async () => {
    mockRepo.findAll = mock(() => Promise.resolve([]))

    const result = await useCase.execute(undefined, mockRepo)

    expect(result).toEqual([])
    expect(mockRepo.findAll).toHaveBeenCalledWith(undefined)
  })
})
