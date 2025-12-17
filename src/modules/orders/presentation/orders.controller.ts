import { Elysia } from "elysia";
import { t } from "elysia";
import { ordersModule } from "../infrastructure/orders.module";
import {
  OrderDto,
  OrderInputDto,
  OrderUpdateDto,
  OrderQueryDto,
  OrdersResponseDto,
} from "./orders.dto";
import { authGuard } from "../../auth/presentation/auth.guard";

export const ordersController = new Elysia({ prefix: "/orders" })
  .use(ordersModule)
  // Public routes - must come before auth guard
  .get(
    "/:id",
    async ({ params, getOrderUC, orderRepo }) => {
      const order = await getOrderUC.execute(params.id, orderRepo);
      return {
        ...order,
        items: order.items.map((item) => ({
          ...item,
          originalPrice: item.originalPrice ?? undefined,
        })),
        subtotal: order.subtotal ? parseFloat(order.subtotal) : undefined,
        deliveryFee: order.deliveryFee
          ? parseFloat(order.deliveryFee)
          : undefined,
        total: parseFloat(order.total),
        pointsDiscount: order.pointsDiscount
          ? parseFloat(order.pointsDiscount)
          : undefined,
        driverId: order.driverId ?? undefined,
        receiptImage: order.receiptImage ?? undefined,
        paymentMethod: order.paymentMethod ?? undefined,
        pointsUsed: order.pointsUsed ?? undefined,
        createdAt: order.createdAt.toISOString(),
        deliveredAt: order.deliveredAt?.toISOString() ?? undefined,
        date: order.date?.toISOString() ?? undefined,
        timestamp: order.timestamp ?? undefined,
        deliveryTimestamp: order.deliveryTimestamp ?? undefined,
      };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      response: OrderDto,
    }
  )
  .post(
    "/",
    async ({ body, createOrderUC, orderRepo }) => {
      const order = await createOrderUC.execute(
        {
          customerName: body.customerName,
          phone: body.phone,
          address: body.address,
          items: body.items,
          subtotal: body.subtotal,
          deliveryFee: body.deliveryFee,
          paymentMethod: body.paymentMethod,
          pointsUsed: body.pointsUsed,
          pointsDiscount: body.pointsDiscount,
        },
        orderRepo
      );
      return {
        ...order,
        items: order.items.map((item) => ({
          ...item,
          originalPrice: item.originalPrice ?? undefined,
        })),
        subtotal: order.subtotal ? parseFloat(order.subtotal) : undefined,
        deliveryFee: order.deliveryFee
          ? parseFloat(order.deliveryFee)
          : undefined,
        total: parseFloat(order.total),
        pointsDiscount: order.pointsDiscount
          ? parseFloat(order.pointsDiscount)
          : undefined,
        driverId: order.driverId ?? undefined,
        receiptImage: order.receiptImage ?? undefined,
        paymentMethod: order.paymentMethod ?? undefined,
        pointsUsed: order.pointsUsed ?? undefined,
        createdAt: order.createdAt.toISOString(),
        deliveredAt: order.deliveredAt?.toISOString() ?? undefined,
        date: order.date?.toISOString() ?? undefined,
        timestamp: order.timestamp ?? undefined,
        deliveryTimestamp: order.deliveryTimestamp ?? undefined,
      };
    },
    {
      body: OrderInputDto,
      response: OrderDto,
    }
  )
  // Protected routes - require authentication
  .use(authGuard(["admin", "driver", "cs"]))
  .get(
    "/",
    async ({ query, getOrdersUC, orderRepo }) => {
      const result = await getOrdersUC.execute(
        {
          status: query.status,
          driverId: query.driverId,
          page: query.page,
          limit: query.limit,
        },
        orderRepo
      );
      return {
        data: result.data.map((order) => ({
          ...order,
          items: order.items.map((item) => ({
            ...item,
            originalPrice: item.originalPrice ?? undefined,
          })),
          subtotal: order.subtotal ? parseFloat(order.subtotal) : undefined,
          deliveryFee: order.deliveryFee
            ? parseFloat(order.deliveryFee)
            : undefined,
          total: parseFloat(order.total),
          pointsDiscount: order.pointsDiscount
            ? parseFloat(order.pointsDiscount)
            : undefined,
          driverId: order.driverId ?? undefined,
          receiptImage: order.receiptImage ?? undefined,
          paymentMethod: order.paymentMethod ?? undefined,
          pointsUsed: order.pointsUsed ?? undefined,
          createdAt: order.createdAt.toISOString(),
          deliveredAt: order.deliveredAt?.toISOString() ?? undefined,
          date: order.date?.toISOString() ?? undefined,
          timestamp: order.timestamp ?? undefined,
          deliveryTimestamp: order.deliveryTimestamp ?? undefined,
        })),
        pagination: result.pagination,
      };
    },
    {
      query: OrderQueryDto,
      response: OrdersResponseDto,
    }
  )
  .patch(
    "/:id",
    async ({ params, body, updateOrderUC, orderRepo }) => {
      const updateData: any = {};
      if (body.status !== undefined) updateData.status = body.status;
      if (body.driverId !== undefined) updateData.driverId = body.driverId;
      if (body.receiptImage !== undefined)
        updateData.receiptImage = body.receiptImage;

      const order = await updateOrderUC.execute(
        params.id,
        updateData,
        orderRepo
      );
      return {
        ...order,
        items: order.items.map((item) => ({
          ...item,
          originalPrice: item.originalPrice ?? undefined,
        })),
        subtotal: order.subtotal ? parseFloat(order.subtotal) : undefined,
        deliveryFee: order.deliveryFee
          ? parseFloat(order.deliveryFee)
          : undefined,
        total: parseFloat(order.total),
        pointsDiscount: order.pointsDiscount
          ? parseFloat(order.pointsDiscount)
          : undefined,
        driverId: order.driverId ?? undefined,
        receiptImage: order.receiptImage ?? undefined,
        paymentMethod: order.paymentMethod ?? undefined,
        pointsUsed: order.pointsUsed ?? undefined,
        createdAt: order.createdAt.toISOString(),
        deliveredAt: order.deliveredAt?.toISOString() ?? undefined,
        date: order.date?.toISOString() ?? undefined,
        timestamp: order.timestamp ?? undefined,
        deliveryTimestamp: order.deliveryTimestamp ?? undefined,
      };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: OrderUpdateDto,
      response: OrderDto,
    }
  );
