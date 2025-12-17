import type { IOrderRepository } from "../domain/orders.iface";
import type { IProductRepository } from "../../products/domain/products.iface";
import type { ICustomerRepository } from "../../customers/domain/customers.iface";
import type { Order, PaymentMethod } from "../domain/order.entity";
import { BadRequestError } from "../../../shared/presentation/errors";

export class CreateOrderUseCase {
  async execute(
    data: {
      customerName: string;
      phone: string;
      address: string;
      items: Array<{ id: string; quantity: number }>;
      subtotal?: number;
      deliveryFee?: number;
      paymentMethod: PaymentMethod;
      pointsUsed?: number;
      pointsDiscount?: number;
    },
    orderRepo: IOrderRepository,
    productRepo: IProductRepository,
    customerRepo: ICustomerRepository
  ): Promise<Order> {
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

    // Validate stock availability and decrement stock
    for (const item of data.items) {
      const product = await productRepo.findById(item.id);
      if (!product) {
        throw new BadRequestError([
          {
            path: "items",
            message: `Product ${item.id} not found`,
          },
        ]);
      }

      if (product.stock < item.quantity) {
        throw new BadRequestError([
          {
            path: "items",
            message: `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
          },
        ]);
      }

      // Decrement stock
      await productRepo.update(item.id, {
        stock: product.stock - item.quantity,
      });
    }

    // Calculate total if not provided
    const subtotal = data.subtotal || 0;
    const deliveryFee = data.deliveryFee || 0;
    const pointsDiscount = data.pointsDiscount || 0;
    const pointsUsed = data.pointsUsed || 0;

    // Create or update customer
    const existingCustomer = await customerRepo.findByPhone(data.phone);
    if (existingCustomer) {
      // Update customer info (name, address) if provided
      await customerRepo.update(data.phone, {
        name: data.customerName,
        address: data.address,
      });
    } else {
      // Create new customer
      await customerRepo.create({
        phone: data.phone,
        name: data.customerName,
        address: data.address,
        points: 0,
        totalSpent: 0,
        totalOrders: 0,
      });
    }

    // Validate and deduct points if used
    if (pointsUsed > 0) {
      const customer = await customerRepo.findByPhone(data.phone);
      if (!customer) {
        throw new BadRequestError([
          {
            path: "phone",
            message: "Customer not found",
          },
        ]);
      }

      if (customer.points < pointsUsed) {
        throw new BadRequestError([
          {
            path: "pointsUsed",
            message: `Insufficient points. Available: ${customer.points}, Required: ${pointsUsed}`,
          },
        ]);
      }

      // Deduct points immediately
      await customerRepo.update(data.phone, {
        pointsDelta: -pointsUsed,
      });
    }

    // Create order
    const order = await orderRepo.create({
      customerName: data.customerName,
      phone: data.phone,
      address: data.address,
      items: data.items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      })),
      subtotal: subtotal.toString(),
      deliveryFee: deliveryFee.toString(),
      paymentMethod: data.paymentMethod,
      pointsUsed: data.pointsUsed || 0,
      pointsDiscount: pointsDiscount.toString(),
    });

    // Calculate and update points (only if order is completed/delivered)
    // Points are calculated when order status changes to "delivered"
    // This will be handled in UpdateOrderUseCase when status changes to "delivered"

    return order;
  }
}
