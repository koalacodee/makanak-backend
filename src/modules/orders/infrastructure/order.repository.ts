import { eq, and, desc, count, inArray, ilike, or } from "drizzle-orm";
import { orders, orderItems, products } from "../../../drizzle/schema";
import db from "../../../drizzle";
import type { IOrderRepository } from "../domain/orders.iface";
import type { Order, OrderItem, OrderStatus } from "../domain/order.entity";

export class OrderRepository implements IOrderRepository {
  constructor(private database: typeof db) {}

  async findAll(filters: {
    status?: string;
    driverId?: string;
    page?: number;
    limit?: number;
    search?: string;
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
    if (filters.search) {
      conditions.push(
        or(
          ilike(orders.customerName, `%${filters.search}%`),
          ilike(orders.phone, `%${filters.search}%`),
          ilike(orders.referenceCode, `%${filters.search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await this.database.query.orders.findMany({
      where: whereClause,
      limit: limit,
      offset: offset,
      orderBy: desc(orders.createdAt),
      with: {
        items: {
          with: {
            product: {
              columns: {
                name: true,
                stock: true,
              },
            },
          },
        },
      },
    });

    return {
      data: result.map((order) =>
        this.mapToEntity(
          order,
          order.items.map((item) =>
            this.mapOrderItemToEntity(
              item,
              item.product.name,
              item.product.stock
            )
          )
        )
      ),
      total: result.length,
    };
  }

  async findById(id: string): Promise<Order | null> {
    const result = await this.database.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        items: {
          with: {
            product: {
              columns: {
                name: true,
                stock: true,
              },
            },
          },
        },
      },
    });

    if (!result) {
      return null;
    }

    return this.mapToEntity(
      result,
      result.items.map((item) =>
        this.mapOrderItemToEntity(item, item.product.name, item.product.stock)
      )
    );
  }

  async create(data: {
    customerName: string;
    referenceCode?: string;
    phone: string;
    address: string;
    items: Array<{ productId: string; quantity: number }>;
    subtotal?: string;
    deliveryFee?: string;
    paymentMethod: string;
    pointsUsed?: number;
    pointsDiscount?: string;
    pointsEarned?: number;
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

    const order = await this.database.transaction(async (tx) => {
      // Create order
      const [order] = await tx
        .insert(orders)
        .values({
          id: orderId,
          customerName: data.customerName,
          referenceCode: data.referenceCode,
          phone: data.phone,
          address: data.address,
          subtotal: data.subtotal || null,
          deliveryFee: data.deliveryFee || null,
          total,
          status: "pending",
          paymentMethod: data.paymentMethod as any,
          pointsUsed: data.pointsUsed || 0,
          pointsDiscount: data.pointsDiscount || "0",
          pointsEarned: data.pointsEarned || 0,
        })
        .returning();

      // 1.  Collect the product ids we need
      const productIds = data.items.map((i) => i.productId);

      // 2.  One SELECT for every product
      const productsRows = await tx
        .select()
        .from(products)
        .where(inArray(products.id, productIds));

      // 3.  Build a Map for O(1) look-ups
      const productById = new Map(productsRows.map((p) => [p.id, p]));

      // 4.  Make sure nothing is missing
      for (const id of productIds) {
        if (!productById.has(id)) {
          throw new Error(`Product ${id} not found`);
        }
      }

      // 5.  Build the rows to insert
      const rowsToInsert = data.items.map((item) => ({
        id: Bun.randomUUIDv7(),
        orderId: orderId,
        productId: item.productId,
        quantity: item.quantity,
        price: productById.get(item.productId)!.price ?? "0",
      }));

      // 6.  One INSERT … RETURNING *  (bulk)
      const insertedRows = await tx
        .insert(orderItems)
        .values(rowsToInsert)
        .returning(); // ← Drizzle gives you the typed rows back

      return {
        order,
        insertedRows: insertedRows.map((row) => ({
          ...row,
          productName: productById.get(row.productId)!.name,
          productStock: productById.get(row.productId)!.stock,
        })),
      };
    });

    // Fetch full order with items
    return this.mapToEntity(
      order.order,
      order.insertedRows.map((row) =>
        this.mapOrderItemToEntity(row, row.productName, row.productStock)
      )
    );
  }

  async update(
    id: string,
    data: {
      status?: OrderStatus;
      driverId?: string;
      deliveredAt?: Date;
    }
  ): Promise<Order> {
    const updateData: Partial<typeof orders.$inferInsert> = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.driverId !== undefined) updateData.driverId = data.driverId;
    if (data.deliveredAt !== undefined)
      updateData.deliveredAt = data.deliveredAt;

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

  private async fetchOrderItems(orderId: string): Promise<OrderItem[]> {
    const items = await this.database
      .select({
        orderItem: orderItems,
        product: products,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    return items.map((item) =>
      this.mapOrderItemToEntity(
        item.orderItem,
        item.product.name,
        item.product.stock
      )
    );
  }

  private mapToEntity(
    row: typeof orders.$inferSelect,
    items: OrderItem[]
  ): Order {
    return {
      id: row.id,
      customerName: row.customerName,
      referenceCode: row.referenceCode || undefined,
      phone: row.phone,
      address: row.address,
      orderItems: items,
      subtotal: row.subtotal ? parseFloat(row.subtotal) : undefined,
      deliveryFee: row.deliveryFee ? parseFloat(row.deliveryFee) : undefined,
      total: row.total ? parseFloat(row.total) : 0,
      status: row.status as any,
      driverId: row.driverId || undefined,
      createdAt: row.createdAt
        ? row.createdAt.toISOString()
        : new Date().toISOString(),
      deliveredAt: row.deliveredAt ? row.deliveredAt.toISOString() : undefined,
      paymentMethod: (row.paymentMethod as any) || null,
      pointsUsed: row.pointsUsed || undefined,
      pointsDiscount: row.pointsDiscount || undefined,
      pointsEarned: row.pointsEarned || undefined,
      date: row.date ? row.date.toISOString() : undefined,
      timestamp: row.timestamp || null,
      deliveryTimestamp: row.deliveryTimestamp || null,
    };
  }

  private mapOrderItemToEntity(
    row: typeof orderItems.$inferSelect,
    productName: string,
    productStock: number
  ): OrderItem {
    return {
      id: row.id,
      orderId: row.orderId,
      productId: row.productId,
      quantity: row.quantity,
      price: parseFloat(row.price || "0"),
      productName: productName,
      productStock: productStock,
    };
  }

  async getReadyOrdersForDriver(driverId: string): Promise<{
    orders: Order[];
    counts: { status: OrderStatus; count: number }[];
  }> {
    const result = await this.database.query.orders.findMany({
      where: and(
        inArray(orders.status, ["ready", "out_for_delivery"]),
        eq(orders.driverId, driverId)
      ),
      orderBy: desc(orders.createdAt),
      with: {
        items: {
          with: {
            product: {
              columns: {
                name: true,
                stock: true,
              },
            },
          },
        },
      },
    });

    const ordersCounts = await this.database
      .select({
        status: orders.status,
        count: count(),
      })
      .from(orders)
      .where(
        and(
          inArray(orders.status, ["ready", "out_for_delivery", "delivered"]),
          eq(orders.driverId, driverId)
        )
      )
      .groupBy(orders.status);

    return {
      orders: result.map((row) =>
        this.mapToEntity(
          row,
          row.items.map((item) =>
            this.mapOrderItemToEntity(
              item,
              item.product.name,
              item.product.stock
            )
          )
        )
      ),
      counts: ordersCounts,
    };
  }

  async count(filters?: { status?: OrderStatus }): Promise<number> {
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(orders.status, filters.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await this.database
      .select({ count: count() })
      .from(orders)
      .where(whereClause);

    return result[0]?.count || 0;
  }
}
