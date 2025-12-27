import { Static, t } from "elysia";

export const QuantityTypeEnum = t.Union([
  t.Literal("count"),
  t.Literal("weight"),
]);
export const UnitOfMeasurementEnum = t.Union([
  t.Literal("ton"),
  t.Literal("kg"),
  t.Literal("g"),
  t.Literal("mg"),
  t.Literal("l"),
  t.Literal("ml"),
]);
export const ProductDto = t.Object({
  id: t.String({ format: "uuid" }),
  name: t.String(),
  price: t.Number(),
  category: t.String({ format: "uuid" }),
  description: t.String(),
  stock: t.Number(),
  originalPrice: t.Optional(t.Number()),
  image: t.Optional(t.String({ format: "uri" })),
  quantityType: QuantityTypeEnum,
  unitOfMeasurement: t.Optional(t.Nullable(UnitOfMeasurementEnum)),
});
export const ProductInputDto = t.Object({
  attachWithFileExtension: t.Optional(t.String()),
  name: t.String(),
  price: t.Number(),
  category: t.String({ format: "uuid" }),
  description: t.String(),
  stock: t.Number(),
  originalPrice: t.Optional(t.Number()),
  quantityType: QuantityTypeEnum,
  unitOfMeasurement: t.Optional(t.Nullable(UnitOfMeasurementEnum)),
});

export const ProductQueryDto = t.Object({
  category: t.Optional(t.String({ format: "uuid" })),
  inStock: t.Optional(t.Boolean()),
  page: t.Optional(t.Integer({ default: 1, minimum: 1 })),
  limit: t.Optional(t.Integer({ default: 20, minimum: 1, maximum: 100 })),
  search: t.Optional(t.String()),
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
export type QuantityType = Static<typeof QuantityTypeEnum>;
export type UnitOfMeasurement = Static<typeof UnitOfMeasurementEnum>;
