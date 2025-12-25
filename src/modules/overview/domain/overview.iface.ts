// This module doesn't need a repository interface
// It uses existing repositories from other modules
// This file exists to maintain the architecture pattern
export interface IOverviewRepository {
  getOverview(): Promise<{
    totalSales: number;
    totalOrders: number;
    customersCount: number;
    staffCount: number;
  }>;
}
