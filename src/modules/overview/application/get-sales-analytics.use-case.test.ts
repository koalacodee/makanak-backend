import { describe, it, expect, beforeEach, mock } from "bun:test";
import { GetSalesAnalyticsUseCase } from "./get-sales-analytics.use-case";
import type { IOverviewRepository } from "../domain/overview.iface";
import type {
  GetSalesAnalyticsFilters,
  SalesAnalyticsResult,
} from "./get-sales-analytics.use-case";

describe("GetSalesAnalyticsUseCase", () => {
  let useCase: GetSalesAnalyticsUseCase;
  let mockRepo: IOverviewRepository;

  beforeEach(() => {
    useCase = new GetSalesAnalyticsUseCase();
    mockRepo = {
      getOverview: mock(() =>
        Promise.resolve({
          totalSales: 0,
          totalOrders: 0,
          customersCount: 0,
          staffCount: 0,
        })
      ),
      getSalesAnalytics: mock(() =>
        Promise.resolve({
          totalSales: 0,
          totalOrders: 0,
          orderValueAvg: 0,
          orders: [],
        })
      ),
    };
  });

  it("should return sales analytics without filters", async () => {
    const mockAnalytics: SalesAnalyticsResult = {
      totalSales: 50000,
      totalOrders: 100,
      orderValueAvg: 500,
      orders: [
        {
          referenceCode: "REF001",
          createdAt: new Date(),
          orderItemsCount: 3,
          total: 500,
          status: "delivered",
        },
        {
          referenceCode: "REF002",
          createdAt: new Date(),
          orderItemsCount: 2,
          total: 300,
          status: "delivered",
        },
      ],
    };

    mockRepo.getSalesAnalytics = mock(() => Promise.resolve(mockAnalytics));

    const filters: GetSalesAnalyticsFilters = {};
    const result = await useCase.execute(filters, mockRepo);

    expect(result.totalSales).toBe(50000);
    expect(result.totalOrders).toBe(100);
    expect(result.orderValueAvg).toBe(500);
    expect(result.orders).toHaveLength(2);
    expect(mockRepo.getSalesAnalytics).toHaveBeenCalledWith({});
  });

  it("should return sales analytics with time filter", async () => {
    const mockAnalytics: SalesAnalyticsResult = {
      totalSales: 15000,
      totalOrders: 30,
      orderValueAvg: 500,
      orders: [],
    };

    mockRepo.getSalesAnalytics = mock(() => Promise.resolve(mockAnalytics));

    const filters: GetSalesAnalyticsFilters = { timeFilter: "today" };
    const result = await useCase.execute(filters, mockRepo);

    expect(result.totalSales).toBe(15000);
    expect(result.totalOrders).toBe(30);
    expect(mockRepo.getSalesAnalytics).toHaveBeenCalledWith({
      timeFilter: "today",
    });
  });

  it("should return sales analytics with category filter", async () => {
    const mockAnalytics: SalesAnalyticsResult = {
      totalSales: 10000,
      totalOrders: 20,
      orderValueAvg: 500,
      orders: [],
    };

    mockRepo.getSalesAnalytics = mock(() => Promise.resolve(mockAnalytics));

    const filters: GetSalesAnalyticsFilters = { categoryId: "cat-1" };
    const result = await useCase.execute(filters, mockRepo);

    expect(result.totalSales).toBe(10000);
    expect(mockRepo.getSalesAnalytics).toHaveBeenCalledWith({
      categoryId: "cat-1",
    });
  });

  it("should return sales analytics with status filter", async () => {
    const mockAnalytics: SalesAnalyticsResult = {
      totalSales: 25000,
      totalOrders: 50,
      orderValueAvg: 500,
      orders: [],
    };

    mockRepo.getSalesAnalytics = mock(() => Promise.resolve(mockAnalytics));

    const filters: GetSalesAnalyticsFilters = { status: "delivered" };
    const result = await useCase.execute(filters, mockRepo);

    expect(result.totalSales).toBe(25000);
    expect(mockRepo.getSalesAnalytics).toHaveBeenCalledWith({
      status: "delivered",
    });
  });

  it("should return sales analytics with all filters", async () => {
    const mockAnalytics: SalesAnalyticsResult = {
      totalSales: 5000,
      totalOrders: 10,
      orderValueAvg: 500,
      orders: [
        {
          referenceCode: "REF001",
          createdAt: new Date(),
          orderItemsCount: 2,
          total: 500,
          status: "delivered",
        },
      ],
    };

    mockRepo.getSalesAnalytics = mock(() => Promise.resolve(mockAnalytics));

    const filters: GetSalesAnalyticsFilters = {
      timeFilter: "this_week",
      categoryId: "cat-1",
      status: "delivered",
    };
    const result = await useCase.execute(filters, mockRepo);

    expect(result.totalSales).toBe(5000);
    expect(result.totalOrders).toBe(10);
    expect(result.orders).toHaveLength(1);
    expect(mockRepo.getSalesAnalytics).toHaveBeenCalledWith({
      timeFilter: "this_week",
      categoryId: "cat-1",
      status: "delivered",
    });
  });

  it("should return empty analytics when no orders exist", async () => {
    const mockAnalytics: SalesAnalyticsResult = {
      totalSales: 0,
      totalOrders: 0,
      orderValueAvg: 0,
      orders: [],
    };

    mockRepo.getSalesAnalytics = mock(() => Promise.resolve(mockAnalytics));

    const filters: GetSalesAnalyticsFilters = { timeFilter: "today" };
    const result = await useCase.execute(filters, mockRepo);

    expect(result.totalSales).toBe(0);
    expect(result.totalOrders).toBe(0);
    expect(result.orderValueAvg).toBe(0);
    expect(result.orders).toHaveLength(0);
  });

  it("should handle different time filters", async () => {
    const mockAnalytics: SalesAnalyticsResult = {
      totalSales: 10000,
      totalOrders: 20,
      orderValueAvg: 500,
      orders: [],
    };

    mockRepo.getSalesAnalytics = mock(() => Promise.resolve(mockAnalytics));

    const timeFilters: Array<"today" | "this_week" | "this_month"> = [
      "today",
      "this_week",
      "this_month",
    ];

    for (const timeFilter of timeFilters) {
      await useCase.execute({ timeFilter }, mockRepo);
      expect(mockRepo.getSalesAnalytics).toHaveBeenCalledWith({ timeFilter });
    }
  });

  it("should handle cancelled status filter", async () => {
    const mockAnalytics: SalesAnalyticsResult = {
      totalSales: 0,
      totalOrders: 5,
      orderValueAvg: 0,
      orders: [
        {
          referenceCode: "REF001",
          createdAt: new Date(),
          orderItemsCount: 1,
          total: 100,
          status: "cancelled",
        },
      ],
    };

    mockRepo.getSalesAnalytics = mock(() => Promise.resolve(mockAnalytics));

    const filters: GetSalesAnalyticsFilters = { status: "cancelled" };
    const result = await useCase.execute(filters, mockRepo);

    expect(result.totalOrders).toBe(5);
    expect(result.orders[0].status).toBe("cancelled");
    expect(mockRepo.getSalesAnalytics).toHaveBeenCalledWith({
      status: "cancelled",
    });
  });
});
