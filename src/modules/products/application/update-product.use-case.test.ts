import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { NotFoundError } from '../../../shared/presentation/errors'
import type { Product } from '../domain/product.entity'
import type { IProductRepository } from '../domain/products.iface'
import { UpdateProductUseCase } from './update-product.use-case'

describe('UpdateProductUseCase', () => {
  let useCase: UpdateProductUseCase
  let mockRepo: IProductRepository

  beforeEach(() => {
    useCase = new UpdateProductUseCase()
    mockRepo = {
      findAll: mock(() => Promise.resolve({ data: [], total: 0 })),
      findById: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Product)),
      update: mock(() =>
        Promise.resolve({
          id: '1',
          name: 'Updated Product',
          price: 15,
          category: 'cat-1',
          description: 'Updated description',
          stock: 20,
          quantityType: 'count' as const,
        } as Product),
      ),
      findByIds: mock(() => Promise.resolve([])),
      existsByIds: mock(() => Promise.resolve(false)),
      updateStock: mock(() => Promise.resolve()),
      updateStockMany: mock(() => Promise.resolve()),
      delete: mock(() => Promise.resolve()),
    }
  })

  it('should update product successfully', async () => {
    const existingProduct: Product = {
      id: '1',
      name: 'Product 1',
      price: 10,
      category: 'cat-1',
      description: 'Description 1',
      stock: 10,
      quantityType: 'count',
    }

    mockRepo.findById = mock(() => Promise.resolve(existingProduct))

    const updateData = { name: 'Updated Product', price: 15 }
    const result = await useCase.execute('1', updateData, mockRepo)

    expect(result.product.name).toBe('Updated Product')
    expect(result.product.price).toBe(15)
    expect(mockRepo.findById).toHaveBeenCalledWith('1')
    expect(mockRepo.update).toHaveBeenCalledWith('1', updateData)
  })

  it('should throw NotFoundError when product not found', async () => {
    mockRepo.findById = mock(() => Promise.resolve(null))

    await expect(
      useCase.execute('non-existent', { name: 'Updated' }, mockRepo),
    ).rejects.toThrow(NotFoundError)
    expect(mockRepo.update).not.toHaveBeenCalled()
  })

  it('should update multiple fields', async () => {
    const existingProduct: Product = {
      id: '1',
      name: 'Product 1',
      price: 10,
      category: 'cat-1',
      description: 'Description 1',
      stock: 10,
      quantityType: 'count',
    }

    mockRepo.findById = mock(() => Promise.resolve(existingProduct))

    const updateData = {
      name: 'Updated Product',
      price: 15,
      stock: 20,
    }

    await useCase.execute('1', updateData, mockRepo)

    expect(mockRepo.update).toHaveBeenCalledWith('1', updateData)
  })
})
