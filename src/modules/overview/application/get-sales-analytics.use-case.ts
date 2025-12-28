import { IOverviewRepository } from "../domain/overview.iface";

export type TimeFilter = "today" | "this_week" | "this_month";

export interface GetSalesAnalyticsFilters {
  timeFilter?: TimeFilter;
  categoryId?: string;
  status?: "delivered" | "cancelled";
}

export interface SalesAnalyticsOrder {
  referenceCode: string | null;
  createdAt: Date;
  orderItemsCount: number;
  total: number;
  status: string;
}

export interface SalesAnalyticsResult {
  totalSales: number;
  totalOrders: number;
  orderValueAvg: number;
  orders: SalesAnalyticsOrder[];
}

export class GetSalesAnalyticsUseCase {
  async execute(
    filters: GetSalesAnalyticsFilters,
    overviewRepo: IOverviewRepository
  ): Promise<SalesAnalyticsResult> {
    return await overviewRepo.getSalesAnalytics(filters);
  }
}
