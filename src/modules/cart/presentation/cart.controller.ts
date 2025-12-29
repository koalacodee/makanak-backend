import { Elysia, t } from "elysia";
import { OrderDto } from "../../orders/presentation/orders.dto";
import { cartModule } from "../infrastructure/cart.module";
import {
	AddItemToCartDto,
	BuyNowDto,
	CartDto,
	UpdateCartItemDto,
} from "./cart.dto";

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
		},
	)
	.post(
		"/:phone/items",
		async ({ params, body, addItemToCartUC, cartRepo, productRepo }) => {
			const item = await addItemToCartUC.execute(
				params.phone,
				body.productId,
				body.quantity,
				cartRepo,
				productRepo,
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
		},
	)
	.patch(
		"/items/:id",
		async ({ params, body, updateCartItemUC, cartRepo, productRepo }) => {
			const item = await updateCartItemUC.execute(
				params.id,
				body.quantity,
				cartRepo,
				productRepo,
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
		},
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
		},
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
		},
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
			upsertCustomerUC,
			settingsRepo,
			customerRepo,
			couponRepo,
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
					password: body.password,
				},
				cartRepo,
				orderRepo,
				productRepo,
				upsertCustomerUC,
				settingsRepo,
				customerRepo,
				couponRepo,
			);
			return {
				id: order.id,
				customerName: order.customerName,
				phone: order.phone,
				address: order.address,
				orderItems: order.orderItems,
				subtotal: order.subtotal ? order.subtotal : undefined,
				deliveryFee: order.deliveryFee ? order.deliveryFee : undefined,
				total: order.total,
				status: order.status,
				driverId: order.driverId ?? undefined,
				createdAt: order.createdAt,
				deliveredAt: order.deliveredAt ?? undefined,

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
		},
	);
