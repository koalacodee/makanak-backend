import { type Static, t } from "elysia";

export const OverviewDto = t.Object({
	totalSales: t.Integer(),
	totalOrders: t.Integer(),
	customersCount: t.Integer(),
	staffCount: t.Integer(),
});

export type Overview = Static<typeof OverviewDto>;

export const SalesAnalyticsQueryDto = t.Object({
	timeFilter: t.Optional(
		t.Union([
			t.Literal("today"),
			t.Literal("this_week"),
			t.Literal("this_month"),
		]),
	),
	categoryId: t.Optional(t.String({ format: "uuid" })),
	status: t.Optional(t.Union([t.Literal("delivered"), t.Literal("cancelled")])),
});

export type SalesAnalyticsQuery = Static<typeof SalesAnalyticsQueryDto>;

export const SalesAnalyticsOrderDto = t.Object({
	referenceCode: t.Nullable(t.String()),
	createdAt: t.Date(),
	orderItemsCount: t.Integer(),
	total: t.Number(),
	status: t.String(),
});

export const SalesAnalyticsDto = t.Object({
	totalSales: t.Number(),
	totalOrders: t.Integer(),
	orderValueAvg: t.Number(),
	orders: t.Array(SalesAnalyticsOrderDto),
});

export type SalesAnalytics = Static<typeof SalesAnalyticsDto>;
export type SalesAnalyticsOrder = Static<typeof SalesAnalyticsOrderDto>;
