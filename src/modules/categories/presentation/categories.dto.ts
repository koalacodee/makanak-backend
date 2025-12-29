import { type Static, t } from "elysia";
import { ProductDto } from "../../products/presentation/products.dto";

export const CategoryDto = t.Object({
	id: t.String({ format: "uuid" }),
	name: t.String(),
	icon: t.String(),
	color: t.String(),
	isHidden: t.Boolean(),
	isLocked: t.Boolean(),
	image: t.Optional(t.String()),
});

export const CategoryWithProductsDto = t.Object({
	id: t.String({ format: "uuid" }),
	name: t.String(),
	icon: t.String(),
	color: t.String(),
	isHidden: t.Boolean(),
	isLocked: t.Boolean(),
	image: t.Optional(t.String()),
	products: t.Array(ProductDto),
});

export const CategoryInputDto = t.Object({
	attachWithFileExtension: t.Optional(t.String()),
	name: t.String(),
	icon: t.String(),
	color: t.String(),
	isHidden: t.Optional(t.Boolean()),
	isLocked: t.Optional(t.Boolean()),
});

export const CategoryQueryDto = t.Object({
	includeHidden: t.Optional(t.Boolean({ default: false })),
});

export type Category = Static<typeof CategoryDto>;
export type CategoryInput = Static<typeof CategoryInputDto>;
export type CategoryQuery = Static<typeof CategoryQueryDto>;
export type CategoryWithProducts = Static<typeof CategoryWithProductsDto>;
