import { beforeEach, describe, expect, it, mock } from 'bun:test'
import type { IOverviewRepository } from '../domain/overview.iface'
import { GetOverviewUseCase } from './get-overview.use-case'

describe('GetOverviewUseCase', () => {
  let useCase: GetOverviewUseCase
  let mockRepo: IOverviewRepository

  beforeEach(() => {
    useCase = new GetOverviewUseCase()
    mockRepo = {
      getOverview: mock(() =>
        Promise.resolve({
          totalSales: 0,
          totalOrders: 0,
          customersCount: 0,
          staffCount: 0,
        }),
      ),
      getSalesAnalytics: mock(() =>
        Promise.resolve({
          totalSales: 0,
          totalOrders: 0,
          orderValueAvg: 0,
          orders: [],
        }),
      ),
    }
  })

  it('should return overview data successfully', async () => {
    const mockOverview = {
      totalSales: 50000,
      totalOrders: 150,
      customersCount: 75,
      staffCount: 10,
    }

    mockRepo.getOverview = mock(() => Promise.resolve(mockOverview))

    const result = await useCase.execute(mockRepo)

    expect(result.totalSales).toBe(50000)
    expect(result.totalOrders).toBe(150)
    expect(result.customersCount).toBe(75)
    expect(result.staffCount).toBe(10)
    expect(mockRepo.getOverview).toHaveBeenCalled()
  })

  it('should return zero values when no data exists', async () => {
    const mockOverview = {
      totalSales: 0,
      totalOrders: 0,
      customersCount: 0,
      staffCount: 0,
    }

    mockRepo.getOverview = mock(() => Promise.resolve(mockOverview))

    const result = await useCase.execute(mockRepo)

    expect(result.totalSales).toBe(0)
    expect(result.totalOrders).toBe(0)
    expect(result.customersCount).toBe(0)
    expect(result.staffCount).toBe(0)
  })

  it('should handle high values correctly', async () => {
    const mockOverview = {
      totalSales: 1000000,
      totalOrders: 5000,
      customersCount: 1000,
      staffCount: 50,
    }

    mockRepo.getOverview = mock(() => Promise.resolve(mockOverview))

    const result = await useCase.execute(mockRepo)

    expect(result.totalSales).toBe(1000000)
    expect(result.totalOrders).toBe(5000)
    expect(result.customersCount).toBe(1000)
    expect(result.staffCount).toBe(50)
  })
})
