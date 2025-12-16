// import { t, Static } from "@sinclair/tbox";
import { Static, t } from "elysia";
export const ProductDto = t.Object({
  id: t.String({ format: "uuid" }),
  name: t.String(),
  price: t.Number(),
  unit: t.String(),
  category: t.String({ format: "uuid" }),
  image: t.String({ format: "uri" }),
  description: t.String(),
  stock: t.Integer(),
  originalPrice: t.Optional(t.Number()),
});
export const ProductInputDto = t.Object({
  name: t.String(),
  price: t.Number(),
  unit: t.String(),
  category: t.String({ format: "uuid" }),
  image: t.String({ format: "uri" }),
  description: t.String(),
  stock: t.Integer(),
  originalPrice: t.Optional(t.Number()),
});

export const ProductQueryDto = t.Object({
  category: t.Optional(t.String({ format: "uuid" })),
  inStock: t.Optional(t.Boolean()),
  page: t.Optional(t.Integer({ default: 1, minimum: 1 })),
  limit: t.Optional(t.Integer({ default: 20, minimum: 1, maximum: 100 })),
});

export const PaginationDto = t.Object({
  page: t.Integer(),
  limit: t.Integer(),
  total: t.Integer(),
  totalPages: t.Integer(),
});

export const ProductsResponseDto = t.Object({
  data: t.Array(ProductDto),
  pagination: PaginationDto,
});

export type Product = Static<typeof ProductDto>;
export type ProductInput = Static<typeof ProductInputDto>;
export type ProductQuery = Static<typeof ProductQueryDto>;
