import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import type { Attachment, IAttachmentRepository } from '@/shared/attachments'
import filehub from '@/shared/filehub'
import { NotFoundError } from '../../../shared/presentation/errors'
import type { Product } from '../../products/domain/product.entity'
import type { ICategoryRepository } from '../domain/categories.iface'
import type { Category } from '../domain/category.entity'
import { GetCategoryWithProductsUseCase } from './get-category-with-products.use-case'

describe('GetCategoryWithProductsUseCase', () => {
  let useCase: GetCategoryWithProductsUseCase
  let mockCategoryRepo: ICategoryRepository
  let mockAttachmentRepo: IAttachmentRepository
  let originalGetSignedUrlBatch: typeof filehub.getSignedUrlBatch

  beforeEach(() => {
    useCase = new GetCategoryWithProductsUseCase()
    mockCategoryRepo = {
      findAll: mock(() => Promise.resolve([])),
      findById: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Category)),
      update: mock(() => Promise.resolve({} as Category)),
      delete: mock(() => Promise.resolve()),
      findCategoryWithProductsById: mock(() => Promise.resolve(null)),
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
    // Mock filehub.getSignedUrlBatch
    originalGetSignedUrlBatch = filehub.getSignedUrlBatch
    filehub.getSignedUrlBatch = mock(() =>
      Promise.resolve([]),
    ) as typeof filehub.getSignedUrlBatch
  })

  afterEach(() => {
    filehub.getSignedUrlBatch = originalGetSignedUrlBatch
  })

  it('should return category with products and images', async () => {
    const mockCategory: Category = {
      id: 'cat-1',
      name: 'Category 1',
      icon: 'icon-1',
      color: 'blue',
      isHidden: false,
      isLocked: false,
    }

    const mockProducts: Product[] = [
      {
        id: 'prod-1',
        name: 'Product 1',
        price: 10.99,
        category: 'cat-1',
        description: 'Description 1',
        stock: 100,
        quantityType: 'count',
      },
      {
        id: 'prod-2',
        name: 'Product 2',
        price: 20.99,
        category: 'cat-1',
        description: 'Description 2',
        stock: 50,
        quantityType: 'count',
      },
    ]

    const mockAttachments: Attachment[] = [
      {
        id: 'att-1',
        filename: 'category-image.jpg',
        targetId: 'cat-1',
        size: 1024,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'att-2',
        filename: 'product1-image.jpg',
        targetId: 'prod-1',
        size: 2048,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'att-3',
        filename: 'product2-image.jpg',
        targetId: 'prod-2',
        size: 3072,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const mockSignedUrls = [
      {
        filename: 'category-image.jpg',
        signedUrl: 'https://example.com/signed/category-image.jpg',
        expirationDate: new Date(),
      },
      {
        filename: 'product1-image.jpg',
        signedUrl: 'https://example.com/signed/product1-image.jpg',
        expirationDate: new Date(),
      },
      {
        filename: 'product2-image.jpg',
        signedUrl: 'https://example.com/signed/product2-image.jpg',
        expirationDate: new Date(),
      },
    ]

    mockCategoryRepo.findCategoryWithProductsById = mock(() =>
      Promise.resolve({
        ...mockCategory,
        products: mockProducts,
      }),
    )
    mockAttachmentRepo.findByTargetIds = mock(() =>
      Promise.resolve(mockAttachments),
    )
    filehub.getSignedUrlBatch = mock(() => Promise.resolve(mockSignedUrls))

    const result = await useCase.execute(
      'cat-1',
      mockCategoryRepo,
      mockAttachmentRepo,
    )

    expect(result.id).toBe('cat-1')
    expect(result.name).toBe('Category 1')
    expect(result.image).toBe('https://example.com/signed/category-image.jpg')
    expect(result.products).toHaveLength(2)
    expect(result.products[0].id).toBe('prod-1')
    expect(result.products[0].image).toBe(
      'https://example.com/signed/product1-image.jpg',
    )
    expect(result.products[1].id).toBe('prod-2')
    expect(result.products[1].image).toBe(
      'https://example.com/signed/product2-image.jpg',
    )
    expect(mockCategoryRepo.findCategoryWithProductsById).toHaveBeenCalledWith(
      'cat-1',
    )
    expect(mockAttachmentRepo.findByTargetIds).toHaveBeenCalledWith([
      'cat-1',
      'prod-1',
      'prod-2',
    ])
  })

  it('should return category with products but no images when attachments not found', async () => {
    const mockCategory: Category = {
      id: 'cat-1',
      name: 'Category 1',
      icon: 'icon-1',
      color: 'blue',
      isHidden: false,
      isLocked: false,
    }

    const mockProducts: Product[] = [
      {
        id: 'prod-1',
        name: 'Product 1',
        price: 10.99,
        category: 'cat-1',
        description: 'Description 1',
        stock: 100,
        quantityType: 'count',
      },
    ]

    mockCategoryRepo.findCategoryWithProductsById = mock(() =>
      Promise.resolve({
        ...mockCategory,
        products: mockProducts,
      }),
    )
    mockAttachmentRepo.findByTargetIds = mock(() => Promise.resolve([]))
    filehub.getSignedUrlBatch = mock(() => Promise.resolve([]))

    const result = await useCase.execute(
      'cat-1',
      mockCategoryRepo,
      mockAttachmentRepo,
    )

    expect(result.id).toBe('cat-1')
    expect(result.image).toBeUndefined()
    expect(result.products).toHaveLength(1)
    expect(result.products[0].image).toBeUndefined()
  })

  it('should return category with products when some products have images', async () => {
    const mockCategory: Category = {
      id: 'cat-1',
      name: 'Category 1',
      icon: 'icon-1',
      color: 'blue',
      isHidden: false,
      isLocked: false,
    }

    const mockProducts: Product[] = [
      {
        id: 'prod-1',
        name: 'Product 1',
        price: 10.99,
        category: 'cat-1',
        description: 'Description 1',
        stock: 100,
        quantityType: 'count',
      },
      {
        id: 'prod-2',
        name: 'Product 2',
        price: 20.99,
        category: 'cat-1',
        description: 'Description 2',
        stock: 50,
        quantityType: 'count',
      },
    ]

    const mockAttachments: Attachment[] = [
      {
        id: 'att-2',
        filename: 'product1-image.jpg',
        targetId: 'prod-1',
        size: 2048,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const mockSignedUrls = [
      {
        filename: 'product1-image.jpg',
        signedUrl: 'https://example.com/signed/product1-image.jpg',
        expirationDate: new Date(),
      },
    ]

    mockCategoryRepo.findCategoryWithProductsById = mock(() =>
      Promise.resolve({
        ...mockCategory,
        products: mockProducts,
      }),
    )
    mockAttachmentRepo.findByTargetIds = mock(() =>
      Promise.resolve(mockAttachments),
    )
    filehub.getSignedUrlBatch = mock(() => Promise.resolve(mockSignedUrls))

    const result = await useCase.execute(
      'cat-1',
      mockCategoryRepo,
      mockAttachmentRepo,
    )

    expect(result.products[0].image).toBe(
      'https://example.com/signed/product1-image.jpg',
    )
    expect(result.products[1].image).toBeUndefined()
  })

  it('should throw NotFoundError when category not found', async () => {
    mockCategoryRepo.findCategoryWithProductsById = mock(() =>
      Promise.resolve(null),
    )

    await expect(
      useCase.execute('non-existent', mockCategoryRepo, mockAttachmentRepo),
    ).rejects.toThrow(NotFoundError)
    expect(mockCategoryRepo.findCategoryWithProductsById).toHaveBeenCalledWith(
      'non-existent',
    )
    expect(mockAttachmentRepo.findByTargetIds).not.toHaveBeenCalled()
  })

  it('should handle empty products array', async () => {
    const mockCategory: Category = {
      id: 'cat-1',
      name: 'Category 1',
      icon: 'icon-1',
      color: 'blue',
      isHidden: false,
      isLocked: false,
    }

    mockCategoryRepo.findCategoryWithProductsById = mock(() =>
      Promise.resolve({
        ...mockCategory,
        products: [],
      }),
    )
    mockAttachmentRepo.findByTargetIds = mock(() => Promise.resolve([]))
    filehub.getSignedUrlBatch = mock(() => Promise.resolve([]))

    const result = await useCase.execute(
      'cat-1',
      mockCategoryRepo,
      mockAttachmentRepo,
    )

    expect(result.products).toEqual([])
    expect(mockAttachmentRepo.findByTargetIds).toHaveBeenCalledWith(['cat-1'])
  })
})
