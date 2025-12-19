import { Static, t } from "elysia";

export const OrderStatusEnum = t.Union([
  t.Literal("pending"),
  t.Literal("processing"),
  t.Literal("ready"),
  t.Literal("out_for_delivery"),
  t.Literal("delivered"),
  t.Literal("cancelled"),
]);

export const PaymentMethodEnum = t.Union([
  t.Literal("cod"),
  t.Literal("online"),
]);

// export const CartItemDto = t.Object({
//   id: t.String({ format: "uuid" }),
//   name: t.String(),
//   price: t.Number(),
//   unit: t.String(),
//   category: t.String({ format: "uuid" }),
//   image: t.String({ format: "uri" }),
//   description: t.String(),
//   stock: t.Integer(),
//   originalPrice: t.Optional(t.Number()),
//   quantity: t.Integer(),
// });

export const OrderItemDto = t.Object({
  id: t.String({ format: "uuid" }),
  orderId: t.String({ format: "uuid" }),
  productId: t.String({ format: "uuid" }),
  quantity: t.Integer(),
  price: t.Number(),
});

export const OrderDto = t.Object({
  id: t.String({ format: "uuid" }),
  customerName: t.String(),
  referenceCode: t.Optional(t.String()),
  phone: t.String(),
  address: t.String(),
  orderItems: t.Array(OrderItemDto),
  subtotal: t.Optional(t.Number()),
  deliveryFee: t.Optional(t.Number()),
  total: t.Number(),
  status: OrderStatusEnum,
  driverId: t.Optional(t.String({ format: "uuid" })),
  createdAt: t.String({ format: "date-time" }),
  deliveredAt: t.Optional(t.String({ format: "date-time" })),
  receiptImage: t.Optional(t.String({ format: "uri" })),
});

export const OrderItemInputDto = t.Object({
  id: t.String({ format: "uuid" }),
  quantity: t.Integer({ minimum: 1 }),
});

export const OrderInputDto = t.Object({
  customerName: t.String(),
  phone: t.String(),
  address: t.String(),
  items: t.Array(OrderItemInputDto),
  paymentMethod: PaymentMethodEnum,
  pointsToUse: t.Optional(t.Integer({ minimum: 0 })),
  attachWithFileExtension: t.Optional(t.String()),
});

export const OrderUpdateDto = t.Object({
  status: t.Optional(OrderStatusEnum),
  driverId: t.Optional(t.String({ format: "uuid" })),
  receiptImage: t.Optional(t.String()),
});

export const OrderQueryDto = t.Object({
  status: t.Optional(OrderStatusEnum),
  driverId: t.Optional(t.String({ format: "uuid" })),
  page: t.Optional(t.Integer({ default: 1, minimum: 1 })),
  limit: t.Optional(t.Integer({ default: 20, minimum: 1, maximum: 100 })),
});

export const AssignOrderToDriverDto = t.Object({
  driverId: t.String({ format: "uuid" }),
});

export const ChangeOrderStatusDto = t.Object({
  status: OrderStatusEnum,
});

export const PaginationDto = t.Object({
  page: t.Integer(),
  limit: t.Integer(),
  total: t.Integer(),
  totalPages: t.Integer(),
});

export const OrdersResponseDto = t.Object({
  data: t.Array(OrderDto),
  pagination: PaginationDto,
});

export type Order = Static<typeof OrderDto>;
export type OrderInput = Static<typeof OrderInputDto>;
export type OrderUpdate = Static<typeof OrderUpdateDto>;
export type OrderQuery = Static<typeof OrderQueryDto>;
export type AssignOrderToDriver = Static<typeof AssignOrderToDriverDto>;
export type ChangeOrderStatus = Static<typeof ChangeOrderStatusDto>;
