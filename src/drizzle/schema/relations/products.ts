import { relations } from "drizzle-orm";
import { products } from "../products";
import { categories } from "../categories";
import { orderItems } from "../orderItems";

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
}));
