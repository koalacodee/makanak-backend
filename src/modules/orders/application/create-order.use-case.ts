import type { IOrderRepository } from "../domain/orders.iface";
import type { IProductRepository } from "../../products/domain/products.iface";
import type { ICustomerRepository } from "../../customers/domain/customers.iface";
import type { Order, PaymentMethod } from "../domain/order.entity";
import { BadRequestError } from "../../../shared/presentation/errors";
import { ISettingsRepository } from "@/modules/settings/domain/settings.iface";
import filehub, { SignedPutUrl } from "@/shared/filehub";
import redis from "@/shared/redis";
import crypto from "crypto";
import { UpsertCustomerUseCase } from "@/modules/customers/application/upsert-customer.use-case";
import { ICouponRepository } from "@/modules/coupons/domain/coupon.iface";
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
      password: string;
      couponName?: string;
    },
    orderRepo: IOrderRepository,
    productRepo: IProductRepository,
    upsertCustomerUC: UpsertCustomerUseCase,
    settingsRepo: ISettingsRepository,
    customerRepo: ICustomerRepository,
    couponRepo: ICouponRepository
  ): Promise<{ order: Order; receiptUploadUrl?: string }> {
    let couponDiscount: number | null = null;
    let couponData: { remainingUses: number; id: string } | null = null;
    if (data.couponName) {
      const coupon = await couponRepo.findByName(data.couponName);
      if (!coupon) {
        throw new BadRequestError([
          {
            path: "couponName",
            message: "Coupon not found",
          },
        ]);
      }

      if (coupon.remainingUses <= 0) {
        throw new BadRequestError([
          {
            path: "couponName",
            message: "Coupon has no remaining uses",
          },
        ]);
      }
      couponDiscount = coupon.value;
      couponData = { remainingUses: coupon.remainingUses, id: coupon.id };
    }
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
    const discount =
      (data.pointsToUse
        ? (settings?.pointsSystem?.redemptionValue || 0) * data.pointsToUse
        : 0) + (couponDiscount ?? 0);

    const customer = await upsertCustomerUC.execute(
      {
        phone: data.phone,
        name: data.customerName,
        address: data.address,
        password: data.password,
      },
      customerRepo
    );

    if (data.pointsToUse && data.pointsToUse > customer.points) {
      throw new BadRequestError([
        {
          path: "pointsToUse",
          message:
            "Insufficient points. You have " +
            customer.points +
            " points. You need " +
            (data.pointsToUse - customer.points) +
            " points",
        },
      ]);
    }
    // Calculate total amount for customer stats
    const totalAmount = subtotal + deliveryFee - discount;
    const earnValue = settings?.pointsSystem?.value;
    const pointsToEarn =
      earnValue && earnValue > 0 ? Math.floor(totalAmount / earnValue) : 0;
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
      pointsEarned: pointsToEarn,
      couponDiscount: couponDiscount ?? 0,
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

    // Apply changes immediately when order is created:
    // 1. Deduct stock
    // 2. Deduct points (if used)
    // 3. Update customer totalSpent and totalOrders
    await Promise.all([
      productRepo.updateStockMany(
        data.items.map((item) => ({
          id: item.id,
          delta: -item.quantity,
        }))
      ),
      customerRepo.update(data.phone, {
        pointsDelta: pointsToEarn - (data.pointsToUse ?? 0),
        totalSpentDelta: totalAmount,
        totalOrdersDelta: 1,
      }),
      couponData
        ? couponRepo.update(couponData.id, {
            remainingUses: couponData.remainingUses - 1,
          })
        : Promise.resolve(),
    ]);

    return { order, receiptUploadUrl: receiptUploadUrl?.signedUrl };
  }
}
