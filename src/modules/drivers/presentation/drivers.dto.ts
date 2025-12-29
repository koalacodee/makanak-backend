import { type Static, t } from "elysia";
import { OrderStatusEnum } from "@/modules/orders/presentation/orders.dto";

export const SuccessResponseDto = t.Object({
  success: t.Boolean(),
});

export const ReadyOrderDto = t.Object({
  orderId: t.String(),
  shouldTake: t.Nullable(t.Number()),
  customerName: t.String(),
  customerAddress: t.String(),
});

export const ReadyOrderWithShouldTakeDto = t.Object({
  id: t.String({ format: "uuid" }),
  customerName: t.String(),
  referenceCode: t.Optional(t.String()),
  phone: t.String(),
  address: t.String(),
  orderItems: t.Array(
    t.Object({
      id: t.String({ format: "uuid" }),
      orderId: t.String({ format: "uuid" }),
      productId: t.String({ format: "uuid" }),
      quantity: t.Number(),
      price: t.Number(),
      productName: t.String(),
      productStock: t.Number(),
    })
  ),
  subtotal: t.Optional(t.Number()),
  deliveryFee: t.Optional(t.Number()),
  total: t.Number(),
  status: OrderStatusEnum,
  driverId: t.Optional(t.String({ format: "uuid" })),
  createdAt: t.String({ format: "date-time" }),
  deliveredAt: t.Optional(t.String({ format: "date-time" })),
  receiptImage: t.Optional(t.String({ format: "uri" })),
  paymentMethod: t.Optional(t.Union([t.Literal("cod"), t.Literal("online")])),
  pointsUsed: t.Optional(t.Integer()),
  pointsDiscount: t.Optional(t.Number()),
  date: t.Optional(t.String({ format: "date-time" })),
  shouldTake: t.Nullable(t.Number()),
});

export const JoinShiftResponseDto = t.Object({
  success: t.Boolean(),
  readyOrders: t.Array(ReadyOrderWithShouldTakeDto),
  counts: t.Array(
    t.Object({
      status: OrderStatusEnum,
      count: t.Number(),
    })
  ),
});

export const MarkAsReadyResponseDto = t.Object({
  success: t.Boolean(),
  driverId: t.Optional(t.String()),
});

export type SuccessResponse = Static<typeof SuccessResponseDto>;
export type ReadyOrder = Static<typeof ReadyOrderDto>;
export type JoinShiftResponse = Static<typeof JoinShiftResponseDto>;
export type MarkAsReadyResponse = Static<typeof MarkAsReadyResponseDto>;
export type ReadyOrderWithShouldTake = Static<
  typeof ReadyOrderWithShouldTakeDto
>;
