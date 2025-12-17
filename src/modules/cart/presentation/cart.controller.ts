import { Elysia, t } from "elysia";
import { cartModule } from "../infrastructure/cart.module";
import {
  CartDto,
  AddItemToCartDto,
  UpdateCartItemDto,
  BuyNowDto,
} from "./cart.dto";
import { OrderDto } from "../../orders/presentation/orders.dto";

export const cartController = new Elysia({ prefix: "/carts" })
  .use(cartModule)
  .get(
    "/:phone",
    async ({ params, getCartUC, cartRepo }) => {
      const cart = await getCartUC.execute(params.phone, cartRepo);
      return {
        id: cart.id,
        customerPhone: cart.customerPhone,
        items: cart.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          product: {
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            unit: item.product.unit,
            categoryId: item.product.categoryId,
            category: item.product.category
              ? {
                  id: item.product.category.id,
                  name: item.product.category.name,
                }
              : undefined,
            image: item.product.image,
            description: item.product.description,
            stock: item.product.stock,
            originalPrice: item.product.originalPrice ?? undefined,
          },
        })),
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
      };
    },
    {
      params: t.Object({
        phone: t.String(),
      }),
      response: CartDto,
    }
  )
  .post(
    "/:phone/items",
    async ({ params, body, addItemToCartUC, cartRepo, productRepo }) => {
      const item = await addItemToCartUC.execute(
        params.phone,
        body.productId,
        body.quantity,
        cartRepo,
        productRepo
      );
      return {
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          unit: item.product.unit,
          categoryId: item.product.categoryId,
          category: item.product.category
            ? {
                id: item.product.category.id,
                name: item.product.category.name,
              }
            : undefined,
          image: item.product.image,
          description: item.product.description,
          stock: item.product.stock,
          originalPrice: item.product.originalPrice ?? undefined,
        },
      };
    },
    {
      params: t.Object({
        phone: t.String(),
      }),
      body: AddItemToCartDto,
      response: CartDto.properties.items.items,
    }
  )
  .patch(
    "/items/:id",
    async ({ params, body, updateCartItemUC, cartRepo, productRepo }) => {
      const item = await updateCartItemUC.execute(
        params.id,
        body.quantity,
        cartRepo,
        productRepo
      );
      return {
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          unit: item.product.unit,
          categoryId: item.product.categoryId,
          category: item.product.category
            ? {
                id: item.product.category.id,
                name: item.product.category.name,
              }
            : undefined,
          image: item.product.image,
          description: item.product.description,
          stock: item.product.stock,
          originalPrice: item.product.originalPrice ?? undefined,
        },
      };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: UpdateCartItemDto,
      response: CartDto.properties.items.items,
    }
  )
  .delete(
    "/items/:id",
    async ({ params, removeCartItemUC, cartRepo }) => {
      await removeCartItemUC.execute(params.id, cartRepo);
      return new Response(null, { status: 204 });
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
    }
  )
  .delete(
    "/:phone",
    async ({ params, clearCartUC, cartRepo }) => {
      await clearCartUC.execute(params.phone, cartRepo);
      return new Response(null, { status: 204 });
    },
    {
      params: t.Object({
        phone: t.String(),
      }),
    }
  )
  .post(
    "/:phone/buy-now",
    async ({
      params,
      body,
      buyNowUC,
      cartRepo,
      orderRepo,
      productRepo,
      customerRepo,
    }) => {
      const order = await buyNowUC.execute(
        params.phone,
        {
          customerName: body.customerName,
          address: body.address,
          subtotal: body.subtotal,
          deliveryFee: body.deliveryFee,
          paymentMethod: body.paymentMethod,
          pointsUsed: body.pointsUsed,
          pointsDiscount: body.pointsDiscount,
        },
        cartRepo,
        orderRepo,
        productRepo,
        customerRepo
      );
      return {
        id: order.id,
        customerName: order.customerName,
        phone: order.phone,
        address: order.address,
        items: order.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          unit: item.unit,
          category: item.category,
          image: item.image,
          description: item.description,
          stock: item.stock,
          originalPrice: item.originalPrice ?? undefined,
          quantity: item.quantity,
        })),
        subtotal: order.subtotal ? parseFloat(order.subtotal) : undefined,
        deliveryFee: order.deliveryFee
          ? parseFloat(order.deliveryFee)
          : undefined,
        total: parseFloat(order.total),
        status: order.status,
        driverId: order.driverId ?? undefined,
        createdAt: order.createdAt.toISOString(),
        deliveredAt: order.deliveredAt?.toISOString() ?? undefined,
        receiptImage: order.receiptImage ?? undefined,
        paymentMethod: order.paymentMethod ?? undefined,
        pointsUsed: order.pointsUsed ?? undefined,
        pointsDiscount: order.pointsDiscount
          ? parseFloat(order.pointsDiscount)
          : undefined,
      };
    },
    {
      params: t.Object({
        phone: t.String(),
      }),
      body: BuyNowDto,
      response: OrderDto,
    }
  );
