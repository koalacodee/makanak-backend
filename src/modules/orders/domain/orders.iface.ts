import type {
  Order,
  OrderCancellation,
  OrderStatus,
  PaymentMethod,
} from './order.entity'

export interface IOrderRepository {
  findAll(filters: {
    status?: OrderStatus
    driverId?: string
    page?: number
    limit?: number
    search?: string
  }): Promise<{ data: Order[]; total: number }>
  findById(id: string): Promise<Order | null>
  create(data: {
    customerName: string
    referenceCode?: string
    phone: string
    address: string
    items: Array<{ productId: string; quantity: number }>
    subtotal?: string
    deliveryFee?: string
    paymentMethod: PaymentMethod
    pointsUsed?: number
    pointsDiscount?: string
    pointsEarned?: number
    couponDiscount?: number
    couponId?: string
    cancellation?: Omit<OrderCancellation, 'image'>
    verificationHash?: string
  }): Promise<Order>
  update(
    id: string,
    data: {
      status?: OrderStatus
      driverId?: string
      deliveredAt?: Date
      cancellation?: Partial<Omit<OrderCancellation, 'image'>>
      verificationHash?: string
    },
  ): Promise<Order>
  getReadyOrdersForDriver(driverId: string): Promise<{
    orders: Order[]
    counts: { status: OrderStatus; count: number }[]
  }>
  count(filters?: { status?: OrderStatus }): Promise<number>
  saveCancellation(data: {
    orderId: string
    reason: string
    cancelledBy: 'driver' | 'inventory'
  }): Promise<OrderCancellation>
}
