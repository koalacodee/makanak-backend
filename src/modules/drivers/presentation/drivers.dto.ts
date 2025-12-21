import {
  OrderDto,
  OrderStatusEnum,
} from "@/modules/orders/presentation/orders.dto";
import { Static, t } from "elysia";

export const SuccessResponseDto = t.Object({
  success: t.Boolean(),
});

export const ReadyOrderDto = t.Object({
  orderId: t.String(),
  shouldTake: t.Nullable(t.Number()),
  customerName: t.String(),
  customerAddress: t.String(),
});

export const JoinShiftResponseDto = t.Object({
  success: t.Boolean(),
  readyOrders: t.Array(
    t.Intersect([
      OrderDto,
      t.Object({
        shouldTake: t.Nullable(t.Number()),
      }),
    ])
  ),
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
