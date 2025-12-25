import { Static, t } from "elysia";

export const OverviewDto = t.Object({
  totalSales: t.Integer(),
  totalOrders: t.Integer(),
  customersCount: t.Integer(),
  staffCount: t.Integer(),
});

export type Overview = Static<typeof OverviewDto>;
