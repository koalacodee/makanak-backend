import { IOverviewRepository } from "../domain/overview.iface";
import db from "../../../drizzle";
import { customers, orders, staffMembers } from "@/drizzle/schema";
import { count, eq, sql, sum } from "drizzle-orm";
export class OverviewRepository implements IOverviewRepository {
  constructor(private database: typeof db) {}

  async getOverview(): Promise<{
    totalSales: number;
    totalOrders: number;
    customersCount: number;
    staffCount: number;
  }> {
    // Define the CTEs for each metric
    const totalSalesCTE = this.database.$with("total_sales").as(
      this.database
        .select({
          total: sum(orders.total).mapWith(Number).as("total"),
        })
        .from(orders)
        .where(eq(orders.status, "delivered"))
    );

    const totalOrdersCTE = this.database.$with("total_orders").as(
      this.database
        .select({
          count: count().mapWith(Number).as("orders_count"),
        })
        .from(orders)
    );

    const customersCountCTE = this.database.$with("customers_count").as(
      this.database
        .select({
          count: count().mapWith(Number).as("customers_count"),
        })
        .from(customers)
    );

    const staffCountCTE = this.database.$with("staff_count").as(
      this.database
        .select({
          count: count().mapWith(Number).as("staff_count"),
        })
        .from(staffMembers)
    );

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
      .crossJoin(staffCountCTE);

    // Extract the single result
    const metrics = result[0] ?? {
      totalSales: 0,
      totalOrders: 0,
      customersCount: 0,
      staffCount: 0,
    };

    return {
      totalSales: Number(metrics.totalSales),
      totalOrders: Number(metrics.totalOrders),
      customersCount: Number(metrics.customersCount),
      staffCount: Number(metrics.staffCount),
    };
  }
}
