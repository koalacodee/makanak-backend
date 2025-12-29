import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { NotFoundError } from '../../../shared/presentation/errors'
import type { Coupon } from '../domain/coupon.entity'
import type { ICouponRepository } from '../domain/coupon.iface'
import { DeleteCouponUseCase } from './delete-coupon.use-case'

describe('DeleteCouponUseCase', () => {
  let useCase: DeleteCouponUseCase
  let mockRepo: ICouponRepository

  beforeEach(() => {
    useCase = new DeleteCouponUseCase()
    mockRepo = {
      findAll: mock(() => Promise.resolve([])),
      findById: mock(() => Promise.resolve(null)),
      findByName: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Coupon)),
      update: mock(() => Promise.resolve({} as Coupon)),
      delete: mock(() => Promise.resolve()),
    }
  })

  it('should delete coupon successfully', async () => {
    const existingCoupon: Coupon = {
      id: 'coupon-1',
      name: 'SUMMER2024',
      value: 10,
      remainingUses: 100,
    }

    mockRepo.findById = mock(() => Promise.resolve(existingCoupon))

    await useCase.execute('coupon-1', mockRepo)

    expect(mockRepo.findById).toHaveBeenCalledWith('coupon-1')
    expect(mockRepo.delete).toHaveBeenCalledWith('coupon-1')
  })

  it('should throw NotFoundError when coupon not found', async () => {
    mockRepo.findById = mock(() => Promise.resolve(null))

    await expect(useCase.execute('non-existent', mockRepo)).rejects.toThrow(
      NotFoundError,
    )
    expect(mockRepo.findById).toHaveBeenCalledWith('non-existent')
    expect(mockRepo.delete).not.toHaveBeenCalled()
  })
})
