import { Elysia } from "elysia";
import { t } from "elysia";
import { ordersModule } from "../infrastructure/orders.module";
import {
  OrderDto,
  OrderInputDto,
  OrderQueryDto,
  OrdersResponseDto,
  AssignOrderToDriverDto,
  ChangeOrderStatusDto,
  Order,
} from "./orders.dto";
import { authGuard } from "../../auth/presentation/auth.guard";

export const ordersController = new Elysia({ prefix: "/orders" })
  .use(ordersModule)
  // Public routes - must come before auth guard
  .get(
    "/:id",
    async ({ params, getOrderUC, orderRepo, attachmentRepo }) => {
      const order = await getOrderUC.execute(
        params.id,
        orderRepo,
        attachmentRepo
      );
      return {
        ...order,
        items: order.orderItems.map((item) => ({
          ...item,
          originalPrice: item.price ?? undefined,
        })),
        subtotal: order.subtotal ?? undefined,
        deliveryFee: order.deliveryFee ? order.deliveryFee : undefined,
        total: order.total,
        pointsDiscount: order.pointsDiscount
          ? parseFloat(order.pointsDiscount)
          : undefined,
        driverId: order.driverId ?? undefined,
        receiptImage: order.receiptImage ?? undefined,
        paymentMethod: order.paymentMethod ?? undefined,
        pointsUsed: order.pointsUsed ?? undefined,
        createdAt: order.createdAt,
        deliveredAt: order.deliveredAt ?? undefined,
        referenceCode: order.referenceCode ?? undefined,
        date: order.date ?? undefined,
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
      upsertCustomerUC,
    }) => {
      const order = await createOrderUC.execute(
        {
          customerName: body.customerName,
          phone: body.phone,
          address: body.address,
          items: body.items,
          paymentMethod: body.paymentMethod,
          pointsToUse: body.pointsToUse,
          attachWithFileExtension: body.attachWithFileExtension,
          password: body.password,
        },
        orderRepo,
        productRepo,
        upsertCustomerUC,
        settingsRepo,
        customerRepo
      );

      return {
        ...order,
        order: {
          ...order.order,
          pointsDiscount: order.order.pointsDiscount
            ? parseFloat(order.order.pointsDiscount)
            : undefined,
        },
      };
    },
    {
      body: OrderInputDto,
      response: t.Object({
        order: OrderDto,
        receiptUploadUrl: t.Optional(t.String()),
      }),
    }
  )
  // Protected routes - require authentication
  .use(authGuard(["admin", "driver", "cs", "inventory"]))
  .get(
    "/",
    async ({ query, getOrdersUC, orderRepo, attachmentRepo }) => {
      const result = await getOrdersUC.execute(
        {
          status: query.status,
          driverId: query.driverId,
          page: query.page,
          limit: query.limit,
        },
        orderRepo,
        attachmentRepo
      );
      const toReturn = {
        data: result.data.map((order) => ({
          ...order,
          items: order.orderItems.map((item) => ({
            ...item,
            originalPrice: item.price ?? undefined,
          })),
          subtotal: order.subtotal ?? undefined,
          deliveryFee: order.deliveryFee ?? undefined,
          total: order.total,
          driverId: order.driverId ?? undefined,
          createdAt: order.createdAt,
          referenceCode: order.referenceCode ?? undefined,
          deliveredAt: order.deliveredAt ?? undefined,
          date: order.date ?? undefined,
          timestamp: order.timestamp ?? undefined,
          deliveryTimestamp: order.deliveryTimestamp ?? undefined,
          paymentMethod: order.paymentMethod ?? undefined,
          pointsUsed: order.pointsUsed ?? undefined,
          pointsDiscount: order.pointsDiscount
            ? parseFloat(order.pointsDiscount)
            : undefined,
          status: order.status,
        })),
        pagination: result.pagination,
      };
      console.log(toReturn);
      return toReturn;
    },
    {
      query: OrderQueryDto,
      response: OrdersResponseDto,
    }
  )
  .post(
    "/:id/assign-driver",
    async ({
      params,
      body,
      assignOrderToDriverUC,
      orderRepo,
      staffMemberRepo,
    }) => {
      const order = await assignOrderToDriverUC.execute(
        params.id,
        body.driverId,
        orderRepo,
        staffMemberRepo
      );
      return {
        ...order,
        subtotal: order.subtotal ?? undefined,
        deliveryFee: order.deliveryFee ?? undefined,
        total: order.total,
        paymentMethod: order.paymentMethod ?? undefined,
        pointsUsed: order.pointsUsed ?? undefined,
        pointsDiscount: order.pointsDiscount
          ? parseFloat(order.pointsDiscount)
          : undefined,
        status: order.status,
        driverId: order.driverId ?? undefined,
        createdAt: order.createdAt,
        deliveredAt: order.deliveredAt ?? undefined,
        date: order.date ?? undefined,
        referenceCode: order.referenceCode ?? undefined,
      };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: AssignOrderToDriverDto,
      response: OrderDto,
    }
  )
  .patch(
    "/:id/status",
    async ({
      params,
      body,
      changeOrderStatusUC,
      orderRepo,
      customerRepo,
      settingsRepo,
      productRepo,
      markAsReadyUC,
    }) => {
      const order = await changeOrderStatusUC.execute(
        {
          id: params.id,
          status: body.status,
        },
        orderRepo,
        customerRepo,
        settingsRepo,
        productRepo,
        markAsReadyUC
      );
      return {
        ...order,
        items: order.orderItems.map((item) => ({
          ...item,
          originalPrice: item.price ?? undefined,
        })),
        subtotal: order.subtotal ?? undefined,
        deliveryFee: order.deliveryFee ?? undefined,
        total: order.total,
        driverId: order.driverId ?? undefined,
        createdAt: order.createdAt,
        deliveredAt: order.deliveredAt ?? undefined,
        date: order.date ?? undefined,
        pointsDiscount: order.pointsDiscount
          ? parseFloat(order.pointsDiscount)
          : undefined,
        status: order.status,
      };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: ChangeOrderStatusDto,
      response: OrderDto,
    }
  );
