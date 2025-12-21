import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import db from "../../../drizzle";
import { OrderRepository } from "../../orders/infrastructure/order.repository";
import { JoinShiftUseCase } from "../application/join-shift.use-case";
import { LeaveShiftUseCase } from "../application/leave-shift.use-case";
import { TakeOrderUseCase } from "../application/take-order.use-case";
import { MarkOrderAsDeliveredUseCase } from "../application/mark-order-as-delivered.use-case";
import { MarkAsReadyUseCase } from "../application/mark-as-ready.use-case";
import { driverSocketService } from "./driver-socket.service";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

export const driversModule = new Elysia({ name: "driversModule" })
  .use(
    jwt({
      name: "accessJwt",
      secret: JWT_SECRET,
    })
  )
  .decorate("orderRepo", new OrderRepository(db))
  .decorate("joinShiftUC", new JoinShiftUseCase())
  .decorate("leaveShiftUC", new LeaveShiftUseCase())
  .decorate("takeOrderUC", new TakeOrderUseCase())
  .decorate("markOrderAsDeliveredUC", new MarkOrderAsDeliveredUseCase())
  .decorate("markAsReadyUC", new MarkAsReadyUseCase())
  .decorate("driverSocketService", driverSocketService);
