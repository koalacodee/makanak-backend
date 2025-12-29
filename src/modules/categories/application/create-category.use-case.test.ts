import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import filehub from '@/shared/filehub'
import redis from '@/shared/redis'
import type { ICategoryRepository } from '../domain/categories.iface'
import type { Category } from '../domain/category.entity'
import { CreateCategoryUseCase } from './create-category.use-case'

describe('CreateCategoryUseCase', () => {
  let useCase: CreateCategoryUseCase
  let mockRepo: ICategoryRepository
  let originalGetSignedPutUrl: typeof filehub.getSignedPutUrl
  let originalGetSignedUrl: typeof filehub.getSignedUrl
  let originalRedisSet: typeof redis.set

  beforeEach(() => {
    useCase = new CreateCategoryUseCase()
    mockRepo = {
      findAll: mock(() => Promise.resolve([])),
      findById: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Category)),
      update: mock(() => Promise.resolve({} as Category)),
      delete: mock(() => Promise.resolve()),
      findCategoryWithProductsById: mock(() => Promise.resolve(null)),
    }
    // Mock filehub methods
    originalGetSignedPutUrl = filehub.getSignedPutUrl
    originalGetSignedUrl = filehub.getSignedUrl
    filehub.getSignedPutUrl = mock(() =>
      Promise.resolve({
        filename: 'test-image.jpg',
        signedUrl: 'https://example.com/upload/test-image.jpg',
        expirationDate: new Date(),
      }),
    ) as typeof filehub.getSignedPutUrl
    filehub.getSignedUrl = mock(() =>
      Promise.resolve({
        signedUrl: 'https://example.com/signed/test-image.jpg',
        expirationDate: new Date(),
      }),
    ) as typeof filehub.getSignedUrl
    // Mock redis.set
    originalRedisSet = redis.set
    redis.set = mock(() => Promise.resolve('OK')) as typeof redis.set
  })

  afterEach(() => {
    filehub.getSignedPutUrl = originalGetSignedPutUrl
    filehub.getSignedUrl = originalGetSignedUrl
    redis.set = originalRedisSet
  })

  it('should create category successfully without file attachment', async () => {
    const categoryData: Omit<Category, 'id'> = {
      name: 'New Category',
      icon: 'icon-1',
      color: 'blue',
      isHidden: false,
      isLocked: false,
    }

    const createdCategory: Category = {
      id: 'cat-1',
      ...categoryData,
    }

    mockRepo.create = mock(() => Promise.resolve(createdCategory))

    const result = await useCase.execute(categoryData, mockRepo)

    expect(result.category).toEqual(createdCategory)
    expect(result.uploadUrl).toBeUndefined()
    expect(result.newSignedUrl).toBeUndefined()
    expect(mockRepo.create).toHaveBeenCalledWith(categoryData)
    expect(filehub.getSignedPutUrl).not.toHaveBeenCalled()
    expect(filehub.getSignedUrl).not.toHaveBeenCalled()
    expect(redis.set).not.toHaveBeenCalled()
  })

  it('should create category successfully with file attachment', async () => {
    const categoryData: Omit<Category, 'id'> = {
      name: 'New Category',
      icon: 'icon-1',
      color: 'blue',
      isHidden: false,
      isLocked: false,
    }

    const createdCategory: Category = {
      id: 'cat-1',
      ...categoryData,
    }

    mockRepo.create = mock(() => Promise.resolve(createdCategory))

    const result = await useCase.execute(categoryData, mockRepo, '.jpg')

    expect(result.category).toEqual(createdCategory)
    expect(result.uploadUrl).toBe('https://example.com/upload/test-image.jpg')
    expect(result.newSignedUrl).toBe(
      'https://example.com/signed/test-image.jpg',
    )
    expect(mockRepo.create).toHaveBeenCalledWith(categoryData)
    expect(filehub.getSignedPutUrl).toHaveBeenCalledWith(3600 * 24 * 7, '.jpg')
    expect(filehub.getSignedUrl).toHaveBeenCalledWith('test-image.jpg')
    expect(redis.set).toHaveBeenCalledWith(
      'filehub:test-image.jpg',
      'cat-1',
      'EX',
      3600 * 24 * 7,
    )
  })

  it('should create category with full Category object', async () => {
    const categoryData: Category = {
      id: 'cat-1',
      name: 'Existing Category',
      icon: 'icon-1',
      color: 'blue',
      isHidden: false,
      isLocked: false,
    }

    mockRepo.create = mock(() => Promise.resolve(categoryData))

    const result = await useCase.execute(categoryData, mockRepo)

    expect(result.category).toEqual(categoryData)
    expect(mockRepo.create).toHaveBeenCalledWith(categoryData)
  })

  it('should handle different file extensions', async () => {
    const categoryData: Omit<Category, 'id'> = {
      name: 'New Category',
      icon: 'icon-1',
      color: 'blue',
      isHidden: false,
      isLocked: false,
    }

    const createdCategory: Category = {
      id: 'cat-2',
      ...categoryData,
    }

    mockRepo.create = mock(() => Promise.resolve(createdCategory))

    await useCase.execute(categoryData, mockRepo, '.png')

    expect(filehub.getSignedPutUrl).toHaveBeenCalledWith(3600 * 24 * 7, '.png')
  })
})
