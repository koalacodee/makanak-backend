import { Static, t } from "elysia";

export const CategoryDto = t.Object({
  id: t.String({ format: "uuid" }),
  name: t.String(),
  icon: t.String(),
  color: t.String(),
  image: t.String({ format: "uri" }),
  isHidden: t.Boolean(),
  isLocked: t.Boolean(),
});

export const CategoryInputDto = t.Object({
  id: t.String({ format: "uuid" }),
  name: t.String(),
  icon: t.String(),
  color: t.String(),
  image: t.String({ format: "uri" }),
  isHidden: t.Optional(t.Boolean()),
  isLocked: t.Optional(t.Boolean()),
});

export const CategoryQueryDto = t.Object({
  includeHidden: t.Optional(t.Boolean({ default: false })),
});

export type Category = Static<typeof CategoryDto>;
export type CategoryInput = Static<typeof CategoryInputDto>;
export type CategoryQuery = Static<typeof CategoryQueryDto>;
