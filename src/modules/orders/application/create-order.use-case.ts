import type { IOrderRepository } from "../domain/orders.iface";
import type { IProductRepository } from "../../products/domain/products.iface";
import type { ICustomerRepository } from "../../customers/domain/customers.iface";
import type { Order, PaymentMethod } from "../domain/order.entity";
import { BadRequestError } from "../../../shared/presentation/errors";
import { ISettingsRepository } from "@/modules/settings/domain/settings.iface";
import filehub, { SignedPutUrl } from "@/shared/filehub";
import redis from "@/shared/redis";
import crypto from "crypto";
export class CreateOrderUseCase {
  async execute(
    data: {
      customerName: string;
      phone: string;
      address: string;
      items: Array<{ id: string; quantity: number }>;
      paymentMethod: PaymentMethod;
      pointsToUse?: number;
      attachWithFileExtension?: string;
    },
    orderRepo: IOrderRepository,
    productRepo: IProductRepository,
    customerRepo: ICustomerRepository,
    settingsRepo: ISettingsRepository
  ): Promise<{ order: Order; receiptUploadUrl?: string }> {
    // Validate items
    if (!data.items || data.items.length === 0) {
      throw new BadRequestError([
        {
          path: "items",
          message: "Order must have at least one item",
        },
      ]);
    }

    // Validate quantities
    for (const item of data.items) {
      if (item.quantity <= 0) {
        throw new BadRequestError([
          {
            path: "items",
            message: `Item ${item.id} must have a quantity greater than 0`,
          },
        ]);
      }
    }

    const products = await productRepo.findByIds(
      data.items.map((item) => item.id)
    );

    if (products.length !== data.items.length) {
      throw new BadRequestError([
        {
          path: "items",
          message: "Some products not found",
        },
      ]);
    }
    let subtotal = 0;

    products.forEach((product) => {
      const item = data.items.find((item) => item.id === product.id) as {
        id: string;
        quantity: number;
      };
      if (product.stock < item.quantity) {
        throw new BadRequestError([
          {
            path: "items",
            message: `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
          },
        ]);
      }
      subtotal += product.price * item.quantity;
    });

    const settings = await settingsRepo.find();

    // Calculate total if not provided
    const deliveryFee = settings?.deliveryFee || 0;
    const discount = data.pointsToUse
      ? (settings?.pointsSystem?.redemptionValue || 0) * data.pointsToUse
      : 0;

    // Create or update customer
    let existingCustomer = await customerRepo.findByPhone(data.phone);
    if (existingCustomer) {
      // Update customer info (name, address) if provided
      existingCustomer = await customerRepo.update(data.phone, {
        name: data.customerName,
        address: data.address,
      });
    } else {
      // Create new customer
      existingCustomer = await customerRepo.create({
        phone: data.phone,
        name: data.customerName,
        address: data.address,
        points: 0,
        totalSpent: 0,
        totalOrders: 0,
      });
    }

    if (data.pointsToUse && data.pointsToUse > existingCustomer.points) {
      throw new BadRequestError([
        {
          path: "pointsToUse",
          message:
            "Insufficient points. You have " +
            existingCustomer.points +
            " points. You need " +
            (data.pointsToUse - existingCustomer.points) +
            " points",
        },
      ]);
    }

    // Create order
    const order = await orderRepo.create({
      customerName: data.customerName,
      referenceCode: crypto.randomInt(10000000, 99999999).toString(),
      phone: data.phone,
      address: data.address,
      items: data.items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      })),
      subtotal: subtotal.toString(),
      deliveryFee: deliveryFee.toString(),
      paymentMethod: data.paymentMethod,
      pointsUsed: data.pointsToUse || 0,
      pointsDiscount: discount.toString(),
    });

    let receiptUploadUrl: SignedPutUrl | null = null;
    if (data.paymentMethod == "online") {
      if (!data.attachWithFileExtension) {
        throw new BadRequestError([
          {
            path: "attachWithFileExtension",
            message: "Attach with file extension is required",
          },
        ]);
      }
      receiptUploadUrl = await filehub.getSignedPutUrl(
        3600 * 24 * 7,
        data.attachWithFileExtension
      );
      await redis.set(
        `filehub:${receiptUploadUrl.filename}`,
        order.id,
        "EX",
        3600 * 24 * 7
      );
    }

    // Calculate and update points (only if order is completed/delivered)
    // Points are calculated when order status changes to "delivered"
    // This will be handled in UpdateOrderUseCase when status changes to "delivered"

    return { order, receiptUploadUrl: receiptUploadUrl?.signedUrl };
  }
}
