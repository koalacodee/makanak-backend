import { and, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import type {
	QuantityType,
	UnitOfMeasurement,
} from "@/modules/products/presentation/products.dto";
import type db from "../../../drizzle";
import {
	orderCancellation,
	orderItems,
	orders,
	products,
} from "../../../drizzle/schema";
import type {
	Order,
	OrderCancellation,
	OrderItem,
	OrderStatus,
	PaymentMethod,
} from "../domain/order.entity";
import type { IOrderRepository } from "../domain/orders.iface";

export class OrderRepository implements IOrderRepository {
	constructor(private database: typeof db) {}

	async findAll(filters: {
		status?: OrderStatus;
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
			conditions.push(eq(orders.status, filters.status));
		}
		if (filters.driverId) {
			conditions.push(eq(orders.driverId, filters.driverId));
		}
		if (filters.search) {
			conditions.push(
				or(
					ilike(orders.customerName, `%${filters.search}%`),
					ilike(orders.phone, `%${filters.search}%`),
					ilike(orders.referenceCode, `%${filters.search}%`),
				),
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
								quantityType: true,
								unitOfMeasurement: true,
							},
						},
					},
				},
				cancellation: true,
			},
		});

		return {
			data: result.map((order) =>
				this.mapToEntity(
					order,
					order.items.map((item) =>
						this.mapOrderItemToEntity(item, {
							name: item.product.name,
							stock: parseFloat(item.product.stock),
							quantityType: item.product.quantityType,
							unitOfMeasurement: item.product.unitOfMeasurement ?? undefined,
						}),
					),
					order.cancellation,
				),
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
								quantityType: true,
								unitOfMeasurement: true,
							},
						},
					},
				},
				cancellation: true,
			},
		});

		if (!result) {
			return null;
		}

		return this.mapToEntity(
			result,
			result.items.map((item) =>
				this.mapOrderItemToEntity(item, {
					name: item.product.name,
					stock: parseFloat(item.product.stock),
					quantityType: item.product.quantityType,
					unitOfMeasurement: item.product.unitOfMeasurement ?? undefined,
				}),
			),
			result.cancellation,
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
		paymentMethod: PaymentMethod;
		pointsUsed?: number;
		pointsDiscount?: string;
		pointsEarned?: number;
		couponDiscount?: number;
		couponId?: string;
		cancellation?: Omit<OrderCancellation, "image">;
		verificationHash?: string;
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
					paymentMethod: data.paymentMethod,
					pointsUsed: data.pointsUsed || 0,
					pointsDiscount: data.pointsDiscount || "0",
					pointsEarned: data.pointsEarned || 0,
					couponDiscount: data.couponDiscount || 0,
					couponId: data.couponId || null,
					verificationHash: data.verificationHash || undefined,
				})
				.returning();

			if (data.cancellation) {
				await tx.insert(orderCancellation).values({
					id: Bun.randomUUIDv7(),
					orderId: orderId,
					reason: data.cancellation.reason,
					cancelledBy: data.cancellation.cancelledBy,
					createdAt: new Date(),
					updatedAt: new Date(),
				});
			}
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
				quantity: item.quantity.toString(),
				price: productById.get(item.productId)?.price ?? "0",
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
					productName: productById.get(row.productId)?.name ?? "",
					productStock: productById.get(row.productId)?.stock ?? "0",
					quantityType: productById.get(row.productId)?.quantityType ?? "count",
					unitOfMeasurement:
						productById.get(row.productId)?.unitOfMeasurement ?? undefined,
				})),
			};
		});

		// Fetch full order with items
		return this.mapToEntity(
			order.order,
			order.insertedRows.map((row) =>
				this.mapOrderItemToEntity(row, {
					name: row.productName,
					stock: parseFloat(row.productStock),
					quantityType: row.quantityType,
					unitOfMeasurement: row.unitOfMeasurement ?? undefined,
				}),
			),
		);
	}

	async update(
		id: string,
		data: {
			status?: OrderStatus;
			driverId?: string;
			deliveredAt?: Date;
			cancellation?: Partial<Omit<OrderCancellation, "image">>;
			verificationHash?: string;
		},
	): Promise<Order> {
		const updateData: Partial<typeof orders.$inferInsert> = {};
		const cancellationData: Partial<typeof orderCancellation.$inferInsert> = {};
		if (data.status !== undefined) updateData.status = data.status;
		if (data.driverId !== undefined) updateData.driverId = data.driverId;
		if (data.deliveredAt !== undefined)
			updateData.deliveredAt = data.deliveredAt;
		if (data.cancellation?.reason !== undefined)
			cancellationData.reason = data.cancellation.reason;
		if (data.cancellation?.cancelledBy !== undefined)
			cancellationData.cancelledBy = data.cancellation.cancelledBy;
		if (data.verificationHash !== undefined)
			updateData.verificationHash = data.verificationHash;
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

		if (cancellationData) {
			if (cancellationData.reason && cancellationData.cancelledBy) {
				await this.saveCancellation({
					orderId: id,
					reason: cancellationData.reason,
					cancelledBy: cancellationData.cancelledBy,
				});
			}
		}

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
			this.mapOrderItemToEntity(item.orderItem, {
				name: item.product.name,
				stock: parseFloat(item.product.stock),
				quantityType: item.product.quantityType,
				unitOfMeasurement: item.product.unitOfMeasurement ?? undefined,
			}),
		);
	}

	private mapToEntity(
		row: typeof orders.$inferSelect,
		items: OrderItem[],
		cancellation?: typeof orderCancellation.$inferSelect | null,
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
			status: row.status,
			driverId: row.driverId || undefined,
			createdAt: row.createdAt
				? row.createdAt.toISOString()
				: new Date().toISOString(),
			deliveredAt: row.deliveredAt ? row.deliveredAt.toISOString() : undefined,
			paymentMethod: row.paymentMethod || undefined,
			pointsUsed: row.pointsUsed || undefined,
			pointsDiscount: row.pointsDiscount || undefined,
			pointsEarned: row.pointsEarned || undefined,
			couponDiscount: row.couponDiscount || undefined,
			couponId: row.couponId || undefined,
			date: row.date ? row.date.toISOString() : undefined,
			timestamp: row.timestamp || null,
			deliveryTimestamp: row.deliveryTimestamp || null,
			cancellation: cancellation
				? (this.mapCancellationToEntity(cancellation) ?? undefined)
				: undefined,
			verificationHash: row.verificationHash || undefined,
		};
	}

	private mapOrderItemToEntity(
		row: typeof orderItems.$inferSelect,
		// | (typeof orderItems.$inferSelect & Record<string, any>),
		product: {
			name: string;
			stock: number;
			quantityType: QuantityType;
			unitOfMeasurement?: UnitOfMeasurement;
		},
	): OrderItem {
		// Handle quantity - it's stored as decimal (string) in DB
		const quantityValue = row.quantity;
		const parsedQuantity =
			typeof quantityValue === "string"
				? parseFloat(quantityValue)
				: typeof quantityValue === "number"
					? quantityValue
					: 0;

		return {
			id: row.id,
			orderId: row.orderId,
			productId: row.productId,
			quantity: Number.isNaN(parsedQuantity) ? 0 : parsedQuantity,
			price: parseFloat(row.price || "0"),
			productName: product.name,
			productStock:
				typeof product.stock === "string"
					? parseInt(product.stock, 10)
					: product.stock,
			productQuantityType: product.quantityType,
			productUnitOfMeasurement: product.unitOfMeasurement,
		};
	}

	private mapCancellationToEntity(
		row: typeof orderCancellation.$inferSelect,
	): OrderCancellation | null {
		if (!row) return null;
		return {
			id: row.id,
			orderId: row.orderId || "",
			reason: row.reason,
			createdAt: row.createdAt?.toISOString() || "",
			updatedAt: row.updatedAt?.toISOString() || "",
			cancelledBy: row.cancelledBy || "driver",
		};
	}

	async getReadyOrdersForDriver(driverId: string): Promise<{
		orders: Order[];
		counts: { status: OrderStatus; count: number }[];
	}> {
		const result = await this.database.query.orders.findMany({
			where: and(
				inArray(orders.status, ["ready", "out_for_delivery"]),
				eq(orders.driverId, driverId),
			),
			orderBy: desc(orders.createdAt),
			with: {
				items: {
					with: {
						product: {
							columns: {
								name: true,
								stock: true,
								quantityType: true,
								unitOfMeasurement: true,
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
					eq(orders.driverId, driverId),
				),
			)
			.groupBy(orders.status);

		return {
			orders: result.map((row) =>
				this.mapToEntity(
					row,
					row.items.map((item) =>
						this.mapOrderItemToEntity(item, {
							name: item.product.name,
							stock: parseFloat(item.product.stock),
							quantityType: item.product.quantityType,
							unitOfMeasurement: item.product.unitOfMeasurement ?? undefined,
						}),
					),
				),
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

	async saveCancellation(data: {
		orderId: string;
		reason: string;
		cancelledBy: "driver" | "inventory";
	}): Promise<OrderCancellation> {
		const [result] = await this.database
			.insert(orderCancellation)
			.values({
				id: Bun.randomUUIDv7(),
				orderId: data.orderId,
				reason: data.reason,
				cancelledBy: data.cancelledBy,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.onConflictDoUpdate({
				target: [orderCancellation.orderId],
				set: {
					reason: data.reason,
					cancelledBy: data.cancelledBy,
					updatedAt: new Date(),
				},
			})
			.returning();

		return this.mapCancellationToEntity(result) as OrderCancellation;
	}
}
