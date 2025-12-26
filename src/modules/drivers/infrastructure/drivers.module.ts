import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import db from "../../../drizzle";
import { OrderRepository } from "../../orders/infrastructure/order.repository";
import { JoinShiftUseCase } from "../application/join-shift.use-case";
import { LeaveShiftUseCase } from "../application/leave-shift.use-case";
import { TakeOrderUseCase } from "../application/take-order.use-case";
import { MarkOrderAsDeliveredUseCase } from "../application/mark-order-as-delivered.use-case";
import { MarkAsReadyUseCase } from "../application/mark-as-ready.use-case";
import { CancelOrderUseCase } from "../application/cancel-order.use-case";
import { ProductRepository } from "../../products/infrastructure/product.repository";
import { CouponRepository } from "../../coupons/infrastructure/coupon.repository";
import { CustomerRepository } from "../../customers/infrastructure/customer.repository";
import { driverSocketService } from "./driver-socket.service";
import { ChangeOrderStatusUseCase } from "@/modules/orders/application/change-order-status.use-case";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

export const driversModule = new Elysia({ name: "driversModule" })
  .use(
    jwt({
      name: "accessJwt",
      secret: JWT_SECRET,
    })
  )
  .decorate("orderRepo", new OrderRepository(db))
  .decorate("productRepo", new ProductRepository(db))
  .decorate("couponRepo", new CouponRepository(db))
  .decorate("customerRepo", new CustomerRepository(db))
  .decorate("joinShiftUC", new JoinShiftUseCase())
  .decorate("leaveShiftUC", new LeaveShiftUseCase())
  .decorate("takeOrderUC", new TakeOrderUseCase())
  .decorate("markOrderAsDeliveredUC", new MarkOrderAsDeliveredUseCase())
  .decorate("markAsReadyUC", new MarkAsReadyUseCase())
  .decorate("cancelOrderUC", new CancelOrderUseCase())
  .decorate("driverSocketService", driverSocketService)
  .decorate("changeOrderStatusUC", new ChangeOrderStatusUseCase());
