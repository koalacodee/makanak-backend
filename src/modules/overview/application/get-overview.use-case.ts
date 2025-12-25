import type { IOrderRepository } from "../../orders/domain/orders.iface";
import type { ICustomerRepository } from "../../customers/domain/customers.iface";
import type { IStaffRepository } from "../../staff/domain/staff.iface";

export class GetOverviewUseCase {
  async execute(
    orderRepo: IOrderRepository,
    customerRepo: ICustomerRepository,
    staffRepo: IStaffRepository
  ): Promise<{
    totalSales: number;
    totalOrders: number;
    customersCount: number;
    staffCount: number;
  }> {
    // Get counts in parallel for better performance
    const [deliveredOrdersResult, allOrdersResult, customers, staff] =
      await Promise.all([
        // Count orders with status 'delivered'
        orderRepo.count({ status: "delivered" }),
        // Count all orders
        orderRepo.count(),
        // Get all customers and count
        customerRepo.findAll(),
        // Get all staff and count
        staffRepo.findAll(),
      ]);

    return {
      totalSales: deliveredOrdersResult,
      totalOrders: allOrdersResult,
      customersCount: customers.length,
      staffCount: staff.length,
    };
  }
}
