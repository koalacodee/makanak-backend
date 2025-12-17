import { Order, OrderStatus, PaymentMethod } from "./order.entity";

export interface IOrderRepository {
  findAll(filters: {
    status?: OrderStatus;
    driverId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Order[]; total: number }>;
  findById(id: string): Promise<Order | null>;
  create(data: {
    customerName: string;
    phone: string;
    address: string;
    items: Array<{ productId: string; quantity: number }>;
    subtotal?: string;
    deliveryFee?: string;
    paymentMethod: PaymentMethod;
    pointsUsed?: number;
    pointsDiscount?: string;
  }): Promise<Order>;
  update(
    id: string,
    data: {
      status?: OrderStatus;
      driverId?: string;
      receiptImage?: string;
    }
  ): Promise<Order>;
}
