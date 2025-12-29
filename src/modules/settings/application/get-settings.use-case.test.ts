import { beforeEach, describe, expect, it, mock } from 'bun:test'
import type { StoreSettings } from '../domain/settings.entity'
import type { ISettingsRepository } from '../domain/settings.iface'
import { GetSettingsUseCase } from './get-settings.use-case'

describe('GetSettingsUseCase', () => {
  let useCase: GetSettingsUseCase
  let mockRepo: ISettingsRepository

  beforeEach(() => {
    useCase = new GetSettingsUseCase()
    mockRepo = {
      find: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as StoreSettings)),
      update: mock(() => Promise.resolve({} as StoreSettings)),
    }
  })

  it('should return settings when found', async () => {
    const mockSettings: StoreSettings = {
      id: 'settings-1',
      pointsSystem: {
        active: true,
        value: 10,
        redemptionValue: 0.1,
      },
      deliveryFee: '5.00',
      announcement: {
        active: true,
        message: 'Welcome to our store!',
      },
      socialMedia: {
        facebook: 'https://facebook.com/store',
        instagram: '@store',
        phone: '1234567890',
        email: 'store@example.com',
      },
      paymentInfo: {
        vodafoneCash: '01012345678',
        instaPay: '01012345678',
      },
      promo: {
        isActive: true,
        image: 'https://example.com/promo.jpg',
        topBadge: 'New',
        title: 'Special Offer',
        description: 'Get 20% off',
        code: 'SAVE20',
        buttonText: 'Shop Now',
      },
      content: {
        hero: {
          badge: 'Best Store',
          titleLine1: 'Welcome',
          titleHighlight: 'to Makanak',
          description: 'Fresh groceries delivered to your door',
        },
        features: [
          {
            title: 'Fast Delivery',
            description: 'Get your order in 30 minutes',
          },
        ],
        journey: {
          title: 'How it works',
          steps: [
            {
              title: 'Order',
              description: 'Choose your items',
            },
          ],
        },
        sections: {
          categoriesTitle: 'Categories',
          categoriesSubtitle: 'Browse our selection',
        },
        info: {
          terms: [
            {
              title: 'Terms',
              description: 'Our terms and conditions',
            },
          ],
          quality: {
            title: 'Quality',
            description: 'We guarantee quality',
            hotline: '1234567890',
          },
        },
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    }

    mockRepo.find = mock(() => Promise.resolve(mockSettings))

    const result = await useCase.execute(mockRepo)

    expect(result).toEqual(mockSettings)
    expect(mockRepo.find).toHaveBeenCalledTimes(1)
  })

  it('should return null when settings not found', async () => {
    mockRepo.find = mock(() => Promise.resolve(null))

    const result = await useCase.execute(mockRepo)

    expect(result).toBeNull()
    expect(mockRepo.find).toHaveBeenCalledTimes(1)
  })

  it('should return settings with minimal data', async () => {
    const minimalSettings: StoreSettings = {
      id: 'settings-1',
      pointsSystem: null,
      deliveryFee: null,
      announcement: null,
      socialMedia: null,
      paymentInfo: null,
      promo: null,
      content: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockRepo.find = mock(() => Promise.resolve(minimalSettings))

    const result = await useCase.execute(mockRepo)

    expect(result).toEqual(minimalSettings)
    expect(mockRepo.find).toHaveBeenCalledTimes(1)
  })
})
