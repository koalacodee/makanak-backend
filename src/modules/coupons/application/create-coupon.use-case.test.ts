import { beforeEach, describe, expect, it, mock } from 'bun:test'
import type { Coupon, CouponInput } from '../domain/coupon.entity'
import type { ICouponRepository } from '../domain/coupon.iface'
import { CreateCouponUseCase } from './create-coupon.use-case'

describe('CreateCouponUseCase', () => {
  let useCase: CreateCouponUseCase
  let mockRepo: ICouponRepository

  beforeEach(() => {
    useCase = new CreateCouponUseCase()
    mockRepo = {
      findAll: mock(() => Promise.resolve([])),
      findById: mock(() => Promise.resolve(null)),
      findByName: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Coupon)),
      update: mock(() => Promise.resolve({} as Coupon)),
      delete: mock(() => Promise.resolve()),
    }
  })

  it('should create coupon successfully', async () => {
    const couponData: CouponInput = {
      name: 'SUMMER2024',
      value: 10,
      remainingUses: 100,
    }

    const createdCoupon: Coupon = {
      id: 'coupon-1',
      ...couponData,
    }

    mockRepo.create = mock(() => Promise.resolve(createdCoupon))

    const result = await useCase.execute(couponData, mockRepo)

    expect(result).toEqual(createdCoupon)
    expect(mockRepo.create).toHaveBeenCalledWith(couponData)
  })

  it('should create coupon with zero remaining uses', async () => {
    const couponData: CouponInput = {
      name: 'EXPIRED',
      value: 5,
      remainingUses: 0,
    }

    const createdCoupon: Coupon = {
      id: 'coupon-2',
      ...couponData,
    }

    mockRepo.create = mock(() => Promise.resolve(createdCoupon))

    const result = await useCase.execute(couponData, mockRepo)

    expect(result.remainingUses).toBe(0)
    expect(mockRepo.create).toHaveBeenCalledWith(couponData)
  })

  it('should create coupon with high value', async () => {
    const couponData: CouponInput = {
      name: 'MEGA50',
      value: 50,
      remainingUses: 10,
    }

    const createdCoupon: Coupon = {
      id: 'coupon-3',
      ...couponData,
    }

    mockRepo.create = mock(() => Promise.resolve(createdCoupon))

    const result = await useCase.execute(couponData, mockRepo)

    expect(result.value).toBe(50)
    expect(mockRepo.create).toHaveBeenCalledWith(couponData)
  })
})
