import { Type, Static } from "@sinclair/typebox";

export const LoginDto = Type.Object({
  username: Type.String({ minLength: 1 }),
  password: Type.String({ minLength: 1 }),
});

export const LoginResponseDto = Type.Object({
  token: Type.String(),
  user: Type.Object({
    id: Type.String({ format: "uuid" }),
    username: Type.String(),
    role: Type.Union([
      Type.Literal("admin"),
      Type.Literal("driver"),
      Type.Literal("cs"),
      Type.Literal("inventory"),
    ]),
  }),
});

export const RefreshTokenDto = Type.Object({
  refreshToken: Type.String(),
});

export const RefreshTokenResponseDto = Type.Object({
  accessToken: Type.String(),
  refreshToken: Type.String(),
});

export type LoginInput = Static<typeof LoginDto>;
export type LoginResponse = Static<typeof LoginResponseDto>;
export type RefreshTokenInput = Static<typeof RefreshTokenDto>;
