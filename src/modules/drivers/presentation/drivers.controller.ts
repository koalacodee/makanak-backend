import { Elysia, t } from "elysia";
import { driversModule } from "../infrastructure/drivers.module";
import { authGuard } from "@/modules/auth";
import {
  SuccessResponseDto,
  MarkAsReadyResponseDto,
  JoinShiftResponseDto,
} from "./drivers.dto";
import { driverSocketService } from "../infrastructure/driver-socket.service";

export const driversController = new Elysia({ prefix: "/driver" })
  .use(driversModule)
  .macro({
    auth: {
      async resolve({ query, accessJwt }) {
        const token = (query as { token?: string }).token;

        if (token) {
          try {
            const payload = await accessJwt.verify(token);

            if (
              payload &&
              typeof payload === "object" &&
              "sub" in payload &&
              "role" in payload
            ) {
              const role = payload.role as string;
              if (role === "driver") {
                return {
                  driverId: payload.sub as string,
                  session: payload,
                };
              }
            }
          } catch (error) {
            // Token verification failed
            return { driverId: null, session: null };
          }
        }

        return { driverId: null, session: null };
      },
    },
  })
  .ws("/ws", {
    query: t.Object({
      token: t.String(),
    }),
    auth: true,
    async open(ws) {
      const { driverId, session } = ws.data as {
        driverId: string | null;
        session: unknown;
      };

      if (!driverId || !session) {
        return ws.close(1008, "Unauthorized");
      }

      driverSocketService.addDriverSocket(driverId, ws as any);
    },
    async close(ws) {
      const { driverId } = ws.data as {
        driverId: string | null;
        session: unknown;
      };
      if (driverId) {
        driverSocketService.removeDriverSocket(driverId);
      }
    },
    message(ws, message) {
      // Echo back or handle incoming messages
      ws.send(JSON.stringify({ type: "ack", received: message }));
    },
  })
  .use(authGuard(["driver", "inventory"]))
  .post(
    "/join-shift",
    async ({ user, joinShiftUC, orderRepo }) => {
      const result = await joinShiftUC.execute(user.id, orderRepo);
      return result;
    },
    {
      response: JoinShiftResponseDto,
    }
  )
  .post(
    "/leave-shift",
    async ({ user, leaveShiftUC }) => {
      const result = await leaveShiftUC.execute(user.id);
      return result;
    },
    {
      response: SuccessResponseDto,
    }
  )
  .post(
    "/take-order/:orderId",
    async ({ params, user, takeOrderUC, orderRepo }) => {
      const result = await takeOrderUC.execute(
        params.orderId,
        user.id,
        orderRepo
      );
      return result;
    },
    {
      params: t.Object({
        orderId: t.String(),
      }),
      response: SuccessResponseDto,
    }
  )
  .post(
    "/mark-order-as-delivered/:orderId",
    async ({ params, user, markOrderAsDeliveredUC, orderRepo }) => {
      const result = await markOrderAsDeliveredUC.execute(
        params.orderId,
        user.id,
        orderRepo
      );
      return result;
    },
    {
      params: t.Object({
        orderId: t.String(),
      }),
      response: SuccessResponseDto,
      user: t.Object({
        id: t.String(),
      }),
    }
  )
  .post(
    "/mark-as-ready/:orderId",
    async ({ params, markAsReadyUC, orderRepo, driverSocketService }) => {
      const result = await markAsReadyUC.execute(
        params.orderId,
        orderRepo,
        driverSocketService
      );
      return result;
    },
    {
      params: t.Object({
        orderId: t.String(),
      }),
      response: MarkAsReadyResponseDto,
    }
  );
