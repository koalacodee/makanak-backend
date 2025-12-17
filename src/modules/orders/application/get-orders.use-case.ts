import type { IOrderRepository } from "../domain/orders.iface";
import type { Order, OrderStatus } from "../domain/order.entity";
import { ValidationError } from "../../../shared/presentation/errors";

export class GetOrdersUseCase {
  async execute(
    filters: {
      status?: OrderStatus;
      driverId?: string;
      page?: number;
      limit?: number;
    },
    repo: IOrderRepository
  ): Promise<{
    data: Order[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    // Validate pagination parameters
    if (page < 1) {
      throw new ValidationError([
        {
          path: "page",
          message: "Page must be greater than 0",
        },
      ]);
    }
    if (limit < 1 || limit > 100) {
      throw new ValidationError([
        {
          path: "limit",
          message: "Limit must be between 1 and 100",
        },
      ]);
    }

    const result = await repo.findAll({
      status: filters.status,
      driverId: filters.driverId,
      page,
      limit,
    });

    const totalPages = Math.ceil(result.total / limit);

    return {
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
      },
    };
  }
}
