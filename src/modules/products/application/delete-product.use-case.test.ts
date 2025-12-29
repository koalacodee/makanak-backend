import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { NotFoundError } from '../../../shared/presentation/errors'
import type { Product } from '../domain/product.entity'
import type { IProductRepository } from '../domain/products.iface'
import { DeleteProductUseCase } from './delete-product.use-case'

describe('DeleteProductUseCase', () => {
  let useCase: DeleteProductUseCase
  let mockRepo: IProductRepository

  beforeEach(() => {
    useCase = new DeleteProductUseCase()
    mockRepo = {
      findAll: mock(() => Promise.resolve({ data: [], total: 0 })),
      findById: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Product)),
      update: mock(() => Promise.resolve({} as Product)),
      delete: mock(() => Promise.resolve()),
    }
  })

  it('should delete product successfully', async () => {
    const existingProduct: Product = {
      id: '1',
      name: 'Product 1',
      price: '10.00',
      unit: 'kg',
      category: 'cat-1',
      image: 'https://example.com/img1.jpg',
      description: 'Description 1',
      stock: 10,
    }

    mockRepo.findById = mock(() => Promise.resolve(existingProduct))

    await useCase.execute('1', mockRepo)

    expect(mockRepo.findById).toHaveBeenCalledWith('1')
    expect(mockRepo.delete).toHaveBeenCalledWith('1')
  })

  it('should throw NotFoundError when product not found', async () => {
    mockRepo.findById = mock(() => Promise.resolve(null))

    await expect(useCase.execute('non-existent', mockRepo)).rejects.toThrow(
      NotFoundError,
    )
    expect(mockRepo.delete).not.toHaveBeenCalled()
  })
})
