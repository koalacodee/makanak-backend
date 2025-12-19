import { Elysia } from "elysia";
import { authModule } from "../infrastructure/auth.module";
import { authGuard } from "./auth.guard";
import {
  LoginDto,
  LoginResponseDto,
  RefreshTokenDto,
  RefreshTokenResponseDto,
  MeResponseDto,
} from "./auth.dto";
import { UnauthorizedError } from "@/shared/presentation";

export const authController = new Elysia({ prefix: "/auth" })
  .use(authModule)
  .post(
    "/login",
    async ({
      body,
      loginUC,
      userRepo,
      refreshTokenRepo,
      accessJwt,
      refreshJwt,
      cookie,
    }) => {
      const result = await loginUC.execute(
        body.username,
        body.password,
        userRepo,
        refreshTokenRepo,
        accessJwt,
        refreshJwt
      );

      cookie.refreshToken.value = result.tokens.refreshToken;
      cookie.refreshToken.httpOnly = true;
      cookie.refreshToken.secure = true;
      cookie.refreshToken.maxAge = 60 * 60 * 24 * 30; // 30 days
      cookie.refreshToken.sameSite = "strict";
      cookie.refreshToken.path = "/";

      return {
        token: result.tokens.accessToken,
        user: {
          id: result.user.id,
          username: result.user.username,
          role: result.user.role as "admin" | "driver" | "cs" | "inventory",
        },
      };
    },
    {
      body: LoginDto,
      response: LoginResponseDto,
    }
  )
  .post(
    "/logout",
    async ({ cookie, logoutUC, refreshTokenRepo, refreshJwt }) => {
      // Verify token to get user ID
      const payload = await refreshJwt.verify(cookie.refreshToken.value);
      if (!payload || typeof payload !== "object" || !("sub" in payload)) {
        // If token is invalid, still return 204 (idempotent)
        return new Response(null, { status: 204 });
      }

      await logoutUC.execute(
        cookie.refreshToken.value,
        payload.sub as string,
        refreshTokenRepo
      );
      return new Response(null, { status: 204 });
    },
    {
      cookie: RefreshTokenDto,
    }
  )
  .post(
    "/refresh",
    async ({
      cookie,
      refreshTokenUC,
      userRepo,
      refreshTokenRepo,
      accessJwt,
      refreshJwt,
    }) => {
      const tokens = await refreshTokenUC.execute(
        cookie.refreshToken.value,
        userRepo,
        refreshTokenRepo,
        accessJwt,
        refreshJwt
      );

      cookie.refreshToken.value = tokens.refreshToken;
      cookie.refreshToken.httpOnly = true;
      cookie.refreshToken.secure = true;
      cookie.refreshToken.maxAge = 60 * 60 * 24 * 30; // 30 days
      cookie.refreshToken.sameSite = "strict";
      cookie.refreshToken.path = "/";

      return {
        accessToken: tokens.accessToken,
      };
    },
    {
      cookie: RefreshTokenDto,
      response: RefreshTokenResponseDto,
    }
  )
  .use(authGuard()) // Protect /me endpoint
  .get(
    "/me",
    async ({ accessJwt, getMeUC, userRepo, headers }) => {
      const payload = await accessJwt.verify(
        headers.authorization?.substring(7)
      );
      if (!payload || typeof payload !== "object" || !("sub" in payload)) {
        throw new UnauthorizedError([
          {
            path: "authorization",
            message: "Invalid token",
          },
        ]);
      }
      const me = await getMeUC.execute(payload.sub as string, userRepo);
      return {
        id: me.id,
        username: me.username,
        role: me.role as "admin" | "driver" | "cs" | "inventory",
        createdAt: me.createdAt ?? undefined,
        updatedAt: me.updatedAt ?? undefined,
        lastLoginAt: me.lastLoginAt ?? undefined,
      };
    },
    {
      response: MeResponseDto,
    }
  );
