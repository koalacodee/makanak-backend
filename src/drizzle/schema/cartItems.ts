import { index, integer, pgTable, uuid } from "drizzle-orm/pg-core";
import { carts } from "./carts";
import { products } from "./products";

export const cartItems = pgTable(
	"cart_items",
	{
		id: uuid("id").primaryKey(),
		cartId: uuid("cart_id")
			.notNull()
			.references(() => carts.id, { onDelete: "cascade" }),
		productId: uuid("product_id")
			.notNull()
			.references(() => products.id, { onDelete: "cascade" }),
		quantity: integer("quantity").notNull().default(1),
	},
	(table) => [
		index("cart_items_cart_id_idx").on(table.cartId),
		index("cart_items_product_id_idx").on(table.productId),
	],
);
