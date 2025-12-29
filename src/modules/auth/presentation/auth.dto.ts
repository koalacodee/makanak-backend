import { type Static, t } from 'elysia'

export const LoginDto = t.Object({
  username: t.String({ minLength: 1 }),
  password: t.String({ minLength: 1 }),
})

export const LoginResponseDto = t.Object({
  token: t.String(),
  user: t.Object({
    id: t.String({ format: 'uuid' }),
    username: t.String(),
    role: t.Union([
      t.Literal('admin'),
      t.Literal('driver'),
      t.Literal('cs'),
      t.Literal('inventory'),
    ]),
  }),
})

export const RefreshTokenDto = t.Object({
  refreshToken: t.String(),
})

export const RefreshTokenResponseDto = t.Object({
  accessToken: t.String(),
})

export const MeResponseDto = t.Object({
  id: t.String({ format: 'uuid' }),
  username: t.String(),
  role: t.Union([
    t.Literal('admin'),
    t.Literal('driver'),
    t.Literal('cs'),
    t.Literal('inventory'),
  ]),
  createdAt: t.Optional(t.Date()),
  updatedAt: t.Optional(t.Date()),
  lastLoginAt: t.Optional(t.Date()),
})

export type LoginInput = Static<typeof LoginDto>
export type LoginResponse = Static<typeof LoginResponseDto>
export type RefreshTokenInput = Static<typeof RefreshTokenDto>
export type MeResponse = Static<typeof MeResponseDto>
