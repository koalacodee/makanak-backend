import { type Static, t } from "elysia";

export const SupplierStatusEnum = t.Union([
	t.Literal("active"),
	t.Literal("pending"),
]);

export const SupplierDto = t.Object({
	id: t.String({ format: "uuid" }),
	name: t.String(),
	phone: t.String(),
	category: t.String(),
	companyName: t.Optional(t.String()),
	notes: t.Optional(t.String()),
	status: SupplierStatusEnum,
});

export const SupplierInputDto = t.Object({
	name: t.String(),
	phone: t.String(),
	category: t.String(),
	companyName: t.Optional(t.String()),
	notes: t.Optional(t.String()),
	status: t.Optional(SupplierStatusEnum),
});

export const SupplierQueryDto = t.Object({
	status: t.Optional(SupplierStatusEnum),
	category: t.Optional(t.String()),
});

export type Supplier = Static<typeof SupplierDto>;
export type SupplierInput = Static<typeof SupplierInputDto>;
export type SupplierQuery = Static<typeof SupplierQueryDto>;
