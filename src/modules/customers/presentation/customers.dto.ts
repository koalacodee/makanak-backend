import { Static, t } from "elysia";

export const CustomerDto = t.Object({
  phone: t.String(),
  name: t.Optional(t.String()),
  address: t.Optional(t.String()),
  points: t.Number(),
  totalSpent: t.Optional(t.Number()),
  totalOrders: t.Optional(t.Number()),
});

export const GetCustomerDto = t.Object({
  phone: t.String(),
  password: t.String(),
});

export const CustomerInputDto = t.Object({
  phone: t.Optional(t.String()), // Optional in body, will use path param
  password: t.String(),
  name: t.Optional(t.String()),
  address: t.Optional(t.String()),
});

export const CustomerUpdateDto = t.Object({
  points: t.Optional(t.Number()),
  pointsDelta: t.Optional(t.Number()),
  name: t.Optional(t.String()),
  address: t.Optional(t.String()),
});

export const CustomerPointsInfoDto = t.Object({
  phone: t.String(),
  points: t.Number(),
  totalSpent: t.Number(),
  totalOrders: t.Number(),
});

export const CustomersListDto = t.Array(CustomerDto);

export type Customer = Static<typeof CustomerDto>;
export type CustomerInput = Static<typeof CustomerInputDto>;
export type CustomerUpdate = Static<typeof CustomerUpdateDto>;
export type CustomerPointsInfo = Static<typeof CustomerPointsInfoDto>;
