import { eq, and, desc, count } from "drizzle-orm";
import { orders, orderItems, products } from "../../../drizzle/schema";
import db from "../../../drizzle";
import type { IOrderRepository } from "../domain/orders.iface";
import type { Order, CartItem } from "../domain/order.entity";

export class OrderRepository implements IOrderRepository {
  constructor(private database: typeof db) {}

  async findAll(filters: {
    status?: string;
    driverId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Order[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (filters.status) {
      conditions.push(eq(orders.status, filters.status as any));
    }
    if (filters.driverId) {
      conditions.push(eq(orders.driverId, filters.driverId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [orderData, totalResult] = await Promise.all([
      this.database
        .select()
        .from(orders)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(orders.createdAt)),
      this.database.select({ count: count() }).from(orders).where(whereClause),
    ]);

    // Fetch order items for each order
    const ordersWithItems = await Promise.all(
      orderData.map(async (order) => {
        const items = await this.fetchOrderItems(order.id);
        return this.mapToEntity(order, items);
      })
    );

    return {
      data: ordersWithItems,
      total: totalResult[0]?.count || 0,
    };
  }

  async findById(id: string): Promise<Order | null> {
    const result = await this.database
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const items = await this.fetchOrderItems(id);
    return this.mapToEntity(result[0], items);
  }

  async create(data: {
    customerName: string;
    phone: string;
    address: string;
    items: Array<{ productId: string; quantity: number }>;
    subtotal?: string;
    deliveryFee?: string;
    paymentMethod: string;
    pointsUsed?: number;
    pointsDiscount?: string;
  }): Promise<Order> {
    const orderId = Bun.randomUUIDv7();

    // Calculate total if not provided
    let total = "0";
    if (data.subtotal && data.deliveryFee) {
      const subtotalNum = parseFloat(data.subtotal);
      const deliveryFeeNum = parseFloat(data.deliveryFee);
      const pointsDiscountNum = data.pointsDiscount
        ? parseFloat(data.pointsDiscount)
        : 0;
      total = (subtotalNum + deliveryFeeNum - pointsDiscountNum).toString();
    }

    // Create order
    const [order] = await this.database
      .insert(orders)
      .values({
        id: orderId,
        customerName: data.customerName,
        phone: data.phone,
        address: data.address,
        subtotal: data.subtotal || null,
        deliveryFee: data.deliveryFee || null,
        total,
        status: "pending",
        paymentMethod: data.paymentMethod as any,
        pointsUsed: data.pointsUsed || 0,
        pointsDiscount: data.pointsDiscount || "0",
      })
      .returning();

    // Create order items and fetch product details
    const orderItemsData = await Promise.all(
      data.items.map(async (item) => {
        // Fetch product to get price
        const product = await this.database
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        if (product.length === 0) {
          throw new Error(`Product ${item.productId} not found`);
        }

        const productPrice = product[0].price || "0";

        const orderItemId = Bun.randomUUIDv7();
        await this.database.insert(orderItems).values({
          id: orderItemId,
          orderId: orderId,
          productId: item.productId,
          quantity: item.quantity,
          price: productPrice,
        });

        return {
          productId: item.productId,
          quantity: item.quantity,
          price: productPrice,
        };
      })
    );

    // Fetch full order with items
    const items = await this.fetchOrderItems(orderId);
    return this.mapToEntity(order, items);
  }

  async update(
    id: string,
    data: {
      status?: string;
      driverId?: string;
      receiptImage?: string;
    }
  ): Promise<Order> {
    const updateData: any = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.driverId !== undefined) updateData.driverId = data.driverId;
    if (data.receiptImage !== undefined)
      updateData.receiptImage = data.receiptImage;

    // If status is delivered, set deliveredAt
    if (data.status === "delivered") {
      updateData.deliveredAt = new Date();
      updateData.deliveryTimestamp = Math.floor(Date.now() / 1000);
    }

    const [result] = await this.database
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();

    const items = await this.fetchOrderItems(id);
    return this.mapToEntity(result, items);
  }

  private async fetchOrderItems(orderId: string): Promise<CartItem[]> {
    const items = await this.database
      .select({
        orderItem: orderItems,
        product: products,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    return items.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      price: parseFloat(item.orderItem.price || "0"),
      unit: item.product.unit,
      category: item.product.categoryId,
      image: item.product.image,
      description: item.product.description,
      stock: item.product.stock,
      originalPrice: item.product.originalPrice
        ? parseFloat(item.product.originalPrice)
        : null,
      quantity: item.orderItem.quantity,
    }));
  }

  private mapToEntity(
    row: typeof orders.$inferSelect,
    items: CartItem[]
  ): Order {
    return {
      id: row.id,
      customerName: row.customerName,
      phone: row.phone,
      address: row.address,
      items,
      subtotal: row.subtotal || null,
      deliveryFee: row.deliveryFee || null,
      total: row.total || "0",
      status: row.status as any,
      driverId: row.driverId || null,
      createdAt: row.createdAt || new Date(),
      deliveredAt: row.deliveredAt || null,
      receiptImage: row.receiptImage || null,
      paymentMethod: (row.paymentMethod as any) || null,
      pointsUsed: row.pointsUsed || null,
      pointsDiscount: row.pointsDiscount || null,
      date: row.date || null,
      timestamp: row.timestamp || null,
      deliveryTimestamp: row.deliveryTimestamp || null,
    };
  }
}
