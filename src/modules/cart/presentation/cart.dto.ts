import { type Static, t } from "elysia";

export const CategoryDto = t.Object({
	id: t.String({ format: "uuid" }),
	name: t.String(),
});

export const ProductInCartDto = t.Object({
	id: t.String({ format: "uuid" }),
	name: t.String(),
	price: t.Number(),
	unit: t.String(),
	categoryId: t.String({ format: "uuid" }),
	category: t.Optional(CategoryDto),
	image: t.String({ format: "uri" }),
	description: t.String(),
	stock: t.Integer(),
	originalPrice: t.Optional(t.Number()),
});

export const CartItemDto = t.Object({
	id: t.String({ format: "uuid" }),
	productId: t.String({ format: "uuid" }),
	quantity: t.Integer(),
	product: ProductInCartDto,
});

export const CartDto = t.Object({
	id: t.String({ format: "uuid" }),
	customerPhone: t.String(),
	items: t.Array(CartItemDto),
	createdAt: t.Date(),
	updatedAt: t.Date(),
});

export const AddItemToCartDto = t.Object({
	productId: t.String({ format: "uuid" }),
	quantity: t.Integer({ minimum: 1 }),
});

export const UpdateCartItemDto = t.Object({
	quantity: t.Integer({ minimum: 1 }),
});

export const BuyNowDto = t.Object({
	customerName: t.String(),
	address: t.String(),
	subtotal: t.Optional(t.Number()),
	deliveryFee: t.Optional(t.Number()),
	paymentMethod: t.Union([t.Literal("cod"), t.Literal("online")]),
	pointsUsed: t.Optional(t.Integer({ minimum: 0 })),
	pointsDiscount: t.Optional(t.Number()),
	password: t.String(),
});

export type Cart = Static<typeof CartDto>;
export type CartItem = Static<typeof CartItemDto>;
export type AddItemToCartInput = Static<typeof AddItemToCartDto>;
export type UpdateCartItemInput = Static<typeof UpdateCartItemDto>;
export type BuyNowInput = Static<typeof BuyNowDto>;
