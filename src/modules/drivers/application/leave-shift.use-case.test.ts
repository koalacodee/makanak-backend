import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import redis from '@/shared/redis'
import { BadRequestError } from '../../../shared/presentation/errors'
import { LeaveShiftUseCase } from './leave-shift.use-case'

describe('LeaveShiftUseCase', () => {
  let useCase: LeaveShiftUseCase
  let originalSismember: typeof redis.sismember
  let originalLrem: typeof redis.lrem

  beforeEach(() => {
    useCase = new LeaveShiftUseCase()
    originalSismember = redis.sismember
    originalLrem = redis.lrem
    redis.sismember = mock(() =>
      Promise.resolve(false),
    ) as typeof redis.sismember
    redis.lrem = mock(() => Promise.resolve(1)) as typeof redis.lrem
  })

  afterEach(() => {
    redis.sismember = originalSismember
    redis.lrem = originalLrem
  })

  it('should leave shift successfully when driver is not busy', async () => {
    redis.sismember = mock(() =>
      Promise.resolve(false),
    ) as typeof redis.sismember

    const result = await useCase.execute('driver-1')

    expect(result.success).toBe(true)
    expect(redis.sismember).toHaveBeenCalledWith('busy_drivers', 'driver-1')
    expect(redis.lrem).toHaveBeenCalledWith('available_drivers', 1, 'driver-1')
  })

  it('should throw BadRequestError when driver is busy', async () => {
    redis.sismember = mock(() =>
      Promise.resolve(true),
    ) as typeof redis.sismember

    await expect(useCase.execute('driver-1')).rejects.toThrow(BadRequestError)

    expect(redis.sismember).toHaveBeenCalledWith('busy_drivers', 'driver-1')
    expect(redis.lrem).not.toHaveBeenCalled()
  })
})
