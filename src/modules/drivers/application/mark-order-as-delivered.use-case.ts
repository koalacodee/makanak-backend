import type { IOrderRepository } from "../../orders/domain/orders.iface";
import redis from "@/shared/redis";
import {
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  TooManyRequestsError,
} from "@/shared/presentation";
import { verifyCodeAndHash } from "@/shared/helpers/hash";
import { ChangeOrderStatusUseCase } from "@/modules/orders/application/change-order-status.use-case";
import { MarkAsReadyUseCase } from "./mark-as-ready.use-case";
import { ICustomerRepository } from "@/modules/customers/domain/customers.iface";
import { IProductRepository } from "@/modules/products/domain/products.iface";
import { ICouponRepository } from "@/modules/coupons/domain/coupon.iface";

export class MarkOrderAsDeliveredUseCase {
  async execute(
    orderId: string,
    driverId: string,
    verificationCode: string,
    orderRepo: IOrderRepository,
    customerRepo: ICustomerRepository,
    productRepo: IProductRepository,
    couponRepo: ICouponRepository,
    changeOrderStatusUC: ChangeOrderStatusUseCase,
    markAsReadyUC: MarkAsReadyUseCase
  ): Promise<{ success: boolean }> {
    if (!(await checkRateLimit(orderId))) {
      throw new TooManyRequestsError([
        { path: "orderId", message: "Too many attempts" },
      ]);
    }

    const order = await orderRepo.findById(orderId);

    if (!order) {
      throw new NotFoundError([
        { path: "orderId", message: "Order not found" },
      ]);
    }

    if (order.driverId !== driverId) {
      throw new UnauthorizedError([
        { path: "orderId", message: "Order is not assigned to this driver" },
      ]);
    }

    // Verify verification code
    if (!order.verificationHash) {
      throw new BadRequestError([
        {
          path: "verificationCode",
          message: "Order does not have a verification hash",
        },
      ]);
    }

    const isValid = verifyCodeAndHash(verificationCode, order.verificationHash);
    if (!isValid) {
      throw new ForbiddenError([
        {
          path: "verificationCode",
          message: "Invalid verification code",
        },
      ]);
    }

    // Mark the current order as delivered
    await changeOrderStatusUC.execute(
      { id: orderId, status: "delivered" },
      orderRepo,
      customerRepo,
      productRepo,
      couponRepo,
      markAsReadyUC
    );

    // Remove driver from busy_drivers since current order is complete
    await redis.srem("busy_drivers", driverId);

    // Add driver back to available_drivers if they're still on shift
    await redis.rpush("available_drivers", driverId);

    // Optionally assign a new order to the driver if available
    const result = await assignFirstIdleReadyOrderToFirstIdleDriver();
    if (result) {
      // A new order was assigned to a driver (may or may not be the same driver)
      // The order assignment is handled by the assignFirstIdleReadyOrderToFirstIdleDriver function
    }

    return { success: true };
  }
}

export async function assignFirstIdleReadyOrderToFirstIdleDriver() {
  const lua = `
    local driverId = redis.call("LPOP", KEYS[1])
    local orderId = redis.call("LPOP", KEYS[2])

    if not driverId then
      return redis.error_reply("No driver available")
    end

    if not orderId then
      -- Return driver to queue since no order available
      redis.call("RPUSH", KEYS[1], driverId)
      return redis.error_reply("No order available")
    end
    
    -- Mark driver as busy - do NOT put back in available_drivers
    redis.call("SADD", KEYS[3], driverId)

    return { driverId, orderId }
  `;

  try {
    const result = await redis.send("EVAL", [
      lua,
      "3",
      "available_drivers",
      "idle_ready_orders",
      "busy_drivers",
    ]);

    if (Array.isArray(result)) {
      return { driverId: result[0], orderId: result[1] };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error executing Lua script:", error);
    return null;
  }
}

async function checkRateLimit(orderId: string) {
  const attempts = await redis.get(`order:attempt:${orderId}`);
  if (attempts && Number(attempts) >= 5) {
    return false;
  }
  await redis.setex(
    `order:attempt:${orderId}`,
    60,
    (Number(attempts) + 1).toString()
  );
  return true;
}
