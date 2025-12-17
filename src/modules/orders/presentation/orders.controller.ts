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
import { FileHub } from "@/shared/filehub";
import redis from "@/shared/redis";

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
    async ({
      body,
      createOrderUC,
      orderRepo,
      productRepo,
      customerRepo,
      settingsRepo,
    }) => {
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
        orderRepo,
        productRepo,
        customerRepo
      );

      // Handle file upload flow if attach=true
      let uploadKey: string | undefined;
      if (body.attach === true) {
        try {
          const fileHub = FileHub.instance();
          const upload = await fileHub.generateUploadToken({
            expiresInMs: 3600000, // 1 hour
            targetId: order.id,
          });

          // Store mapping in Redis for webhook handler
          await redis.set(`filehub:${upload.uploadKey}`, order.id, "EX", 3600); // 1 hour expiry

          uploadKey = upload.uploadKey;
        } catch (error) {
          // Log error but don't fail the order creation
          console.error("Failed to generate upload token:", error);
        }
      }

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
        uploadKey,
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
    async ({
      params,
      body,
      updateOrderUC,
      orderRepo,
      customerRepo,
      settingsRepo,
      productRepo,
    }) => {
      const updateData: any = {};
      if (body.status !== undefined) updateData.status = body.status;
      if (body.driverId !== undefined) updateData.driverId = body.driverId;
      if (body.receiptImage !== undefined)
        updateData.receiptImage = body.receiptImage;

      const order = await updateOrderUC.execute(
        params.id,
        updateData,
        orderRepo,
        customerRepo,
        settingsRepo,
        productRepo
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
