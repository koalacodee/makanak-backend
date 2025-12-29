import { and, count, eq, inArray, sql, sum } from 'drizzle-orm'
import {
  customers,
  orderItems,
  orders,
  products,
  staffMembers,
} from '@/drizzle/schema'
import type db from '../../../drizzle'
import type {
  GetSalesAnalyticsFilters,
  SalesAnalyticsResult,
} from '../application/get-sales-analytics.use-case'
import type { IOverviewRepository } from '../domain/overview.iface'
export class OverviewRepository implements IOverviewRepository {
  constructor(private database: typeof db) {}

  async getOverview(): Promise<{
    totalSales: number
    totalOrders: number
    customersCount: number
    staffCount: number
  }> {
    // Define the CTEs for each metric
    const totalSalesCTE = this.database.$with('total_sales').as(
      this.database
        .select({
          total: sum(orders.total).mapWith(Number).as('total'),
        })
        .from(orders)
        .where(eq(orders.status, 'delivered')),
    )

    const totalOrdersCTE = this.database.$with('total_orders').as(
      this.database
        .select({
          count: count().mapWith(Number).as('orders_count'),
        })
        .from(orders),
    )

    const customersCountCTE = this.database.$with('customers_count').as(
      this.database
        .select({
          count: count().mapWith(Number).as('customers_count'),
        })
        .from(customers),
    )

    const staffCountCTE = this.database.$with('staff_count').as(
      this.database
        .select({
          count: count().mapWith(Number).as('staff_count'),
        })
        .from(staffMembers),
    )

    // Execute the combined query
    const result = await this.database
      .with(totalSalesCTE, totalOrdersCTE, customersCountCTE, staffCountCTE)
      .select({
        totalSales: sql<number>`COALESCE(${totalSalesCTE.total}, 0)`,
        totalOrders: sql<number>`COALESCE(${totalOrdersCTE.count}, 0)`,
        customersCount: sql<number>`COALESCE(${customersCountCTE.count}, 0)`,
        staffCount: sql<number>`COALESCE(${staffCountCTE.count}, 0)`,
      })
      .from(totalSalesCTE)
      .crossJoin(totalOrdersCTE)
      .crossJoin(customersCountCTE)
      .crossJoin(staffCountCTE)

    // Extract the single result
    const metrics = result[0] ?? {
      totalSales: 0,
      totalOrders: 0,
      customersCount: 0,
      staffCount: 0,
    }

    return {
      totalSales: Number(metrics.totalSales),
      totalOrders: Number(metrics.totalOrders),
      customersCount: Number(metrics.customersCount),
      staffCount: Number(metrics.staffCount),
    }
  }

  async getSalesAnalytics(
    filters: GetSalesAnalyticsFilters,
  ): Promise<SalesAnalyticsResult> {
    // Build date filter conditions
    const dateConditions = []

    if (filters.timeFilter === 'today') {
      dateConditions.push(sql`DATE(${orders.createdAt}) = CURRENT_DATE`)
    } else if (filters.timeFilter === 'this_week') {
      dateConditions.push(
        sql`DATE(${orders.createdAt}) >= DATE_TRUNC('week', CURRENT_DATE)`,
      )
    } else if (filters.timeFilter === 'this_month') {
      dateConditions.push(
        sql`DATE(${orders.createdAt}) >= DATE_TRUNC('month', CURRENT_DATE)`,
      )
    }

    // Build status filter
    const statusConditions = []
    if (filters.status) {
      statusConditions.push(eq(orders.status, filters.status))
    }

    // Build base conditions
    const baseConditions = []
    if (dateConditions.length > 0) {
      baseConditions.push(...dateConditions)
    }
    if (statusConditions.length > 0) {
      baseConditions.push(...statusConditions)
    }

    // If category filter is provided, we need to filter orders that have items in that category
    if (filters.categoryId) {
      const ordersWithCategory = await this.database
        .selectDistinct({ orderId: orderItems.orderId })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(eq(products.categoryId, filters.categoryId))

      const orderIdsWithCategory = ordersWithCategory.map((o) => o.orderId)
      if (orderIdsWithCategory.length === 0) {
        // No orders match the category filter
        return {
          totalSales: 0,
          totalOrders: 0,
          orderValueAvg: 0,
          orders: [],
        }
      }
      baseConditions.push(inArray(orders.id, orderIdsWithCategory))
    }

    // Calculate statistics
    const statsQueryBuilder = this.database
      .select({
        totalSales: sum(orders.total).mapWith(Number).as('totalSales'),
        totalOrders: count().mapWith(Number).as('totalOrders'),
      })
      .from(orders)

    const stats =
      baseConditions.length > 0
        ? await statsQueryBuilder.where(and(...baseConditions))
        : await statsQueryBuilder
    const statsResult = stats[0] ?? { totalSales: 0, totalOrders: 0 }

    const totalSales = Number(statsResult.totalSales) || 0
    const totalOrders = Number(statsResult.totalOrders) || 0
    const orderValueAvg = totalOrders > 0 ? totalSales / totalOrders : 0

    // Get orders with orderItems count
    const ordersQueryBuilder = this.database
      .select({
        id: orders.id,
        referenceCode: orders.referenceCode,
        createdAt: orders.createdAt,
        total: orders.total,
        status: orders.status,
        orderItemsCount: sql<number>`COUNT(${orderItems.id})`.as(
          'orderItemsCount',
        ),
      })
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .groupBy(
        orders.id,
        orders.referenceCode,
        orders.createdAt,
        orders.total,
        orders.status,
      )
      .orderBy(sql`${orders.createdAt} DESC`)

    const ordersResult =
      baseConditions.length > 0
        ? await ordersQueryBuilder.where(and(...baseConditions))
        : await ordersQueryBuilder

    const ordersList = ordersResult.map((order) => ({
      referenceCode: order.referenceCode,
      createdAt: order.createdAt,
      orderItemsCount: Number(order.orderItemsCount) || 0,
      total: Number(order.total) || 0,
      status: order.status,
    }))

    return {
      totalSales,
      totalOrders,
      orderValueAvg: Math.round(orderValueAvg * 100) / 100, // Round to 2 decimal places
      orders: ordersList,
    }
  }
}
