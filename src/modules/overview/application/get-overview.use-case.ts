import type { IOverviewRepository } from '../domain/overview.iface'

export class GetOverviewUseCase {
  async execute(overviewRepo: IOverviewRepository): Promise<{
    totalSales: number
    totalOrders: number
    customersCount: number
    staffCount: number
  }> {
    const overview = await overviewRepo.getOverview()

    return {
      totalSales: overview.totalSales,
      totalOrders: overview.totalOrders,
      customersCount: overview.customersCount,
      staffCount: overview.staffCount,
    }
  }
}
