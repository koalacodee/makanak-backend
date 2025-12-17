import { Static, t } from "elysia";

export const StaffRoleEnum = t.Union([
  t.Literal("admin"),
  t.Literal("driver"),
  t.Literal("cs"),
  t.Literal("inventory"),
]);

export const StaffMemberDto = t.Object({
  id: t.String({ format: "uuid" }),
  name: t.String(),
  username: t.String(),
  role: StaffRoleEnum,
  phone: t.Optional(t.String()),
  activeOrders: t.Optional(t.Integer()),
  specialization: t.Optional(t.String()),
  isOnline: t.Optional(t.Boolean()),
});

export const StaffMemberInputDto = t.Object({
  name: t.String(),
  username: t.String(),
  password: t.String({ minLength: 6 }),
  role: StaffRoleEnum,
  phone: t.Optional(t.String()),
  specialization: t.Optional(t.String()),
});

export const StaffMemberUpdateDto = t.Object({
  name: t.Optional(t.String()),
  username: t.Optional(t.String()),
  password: t.Optional(t.String({ minLength: 6 })),
  role: t.Optional(StaffRoleEnum),
  phone: t.Optional(t.String()),
  specialization: t.Optional(t.String()),
});

export const StaffStatusUpdateDto = t.Object({
  isOnline: t.Boolean(),
});

export const StaffQueryDto = t.Object({
  role: t.Optional(StaffRoleEnum),
});

export type StaffMember = Static<typeof StaffMemberDto>;
export type StaffMemberInput = Static<typeof StaffMemberInputDto>;
export type StaffMemberUpdate = Static<typeof StaffMemberUpdateDto>;
export type StaffStatusUpdate = Static<typeof StaffStatusUpdateDto>;
export type StaffQuery = Static<typeof StaffQueryDto>;
