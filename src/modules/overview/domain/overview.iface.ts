// This module doesn't need a repository interface
// It uses existing repositories from other modules
// This file exists to maintain the architecture pattern
import type {
	GetSalesAnalyticsFilters,
	SalesAnalyticsResult,
} from "../application/get-sales-analytics.use-case";

export interface IOverviewRepository {
	getOverview(): Promise<{
		totalSales: number;
		totalOrders: number;
		customersCount: number;
		staffCount: number;
	}>;
	getSalesAnalytics(
		filters: GetSalesAnalyticsFilters,
	): Promise<SalesAnalyticsResult>;
}
