import type { ICartRepository } from "../domain/cart.iface";
import type { IOrderRepository } from "../../orders/domain/orders.iface";
import type { IProductRepository } from "../../products/domain/products.iface";
import type { ICustomerRepository } from "../../customers/domain/customers.iface";
import type { ISettingsRepository } from "@/modules/settings/domain/settings.iface";
import type { ICouponRepository } from "@/modules/coupons/domain/coupon.iface";
import type { Order, PaymentMethod } from "../../orders/domain/order.entity";
import {
  BadRequestError,
  NotFoundError,
} from "../../../shared/presentation/errors";
import { CreateOrderUseCase } from "../../orders/application/create-order.use-case";
import { UpsertCustomerUseCase } from "@/modules/customers/application/upsert-customer.use-case";

export class BuyNowUseCase {
  private createOrderUC: CreateOrderUseCase;

  constructor() {
    this.createOrderUC = new CreateOrderUseCase();
  }

  async execute(
    customerPhone: string,
    data: {
      customerName: string;
      address: string;
      subtotal?: number;
      deliveryFee?: number;
      paymentMethod: PaymentMethod;
      pointsUsed?: number;
      pointsDiscount?: number;
      password: string;
    },
    cartRepo: ICartRepository,
    orderRepo: IOrderRepository,
    productRepo: IProductRepository,
    upsertCustomerUC: UpsertCustomerUseCase,
    settingsRepo: ISettingsRepository,
    customerRepo: ICustomerRepository,
    couponRepo: ICouponRepository
  ): Promise<Order> {
    // Get cart
    const cart = await cartRepo.findByCustomerPhone(customerPhone);
    if (!cart) {
      throw new NotFoundError([
        {
          path: "cart",
          message: "Cart not found",
        },
      ]);
    }

    // Validate cart has items
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestError([
        {
          path: "cart",
          message: "Cart is empty",
        },
      ]);
    }

    // Convert cart items to order items
    const orderItems = cart.items.map((item) => ({
      id: item.productId,
      quantity: item.quantity,
    }));

    // Calculate subtotal if not provided
    let subtotal = data.subtotal;
    if (subtotal === undefined) {
      subtotal = cart.items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      );
    }

    // Create order using CreateOrderUseCase
    const result = await this.createOrderUC.execute(
      {
        customerName: data.customerName,
        phone: customerPhone,
        address: data.address,
        items: orderItems,
        paymentMethod: data.paymentMethod,
        pointsToUse: data.pointsUsed,
        password: data.password,
      },
      orderRepo,
      productRepo,
      upsertCustomerUC,
      settingsRepo,
      customerRepo,
      couponRepo
    );

    // Clear cart after successful order creation
    await cartRepo.clearCart(cart.id);

    return result.order;
  }
}
