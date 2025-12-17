import { Elysia } from "elysia";
import { Type } from "@sinclair/typebox";
import { authModule } from "../infrastructure/auth.module";
import {
  LoginDto,
  LoginResponseDto,
  RefreshTokenDto,
  RefreshTokenResponseDto,
} from "./auth.dto";

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
    async ({ body, logoutUC, refreshTokenRepo, refreshJwt }) => {
      // Verify token to get user ID
      const payload = await refreshJwt.verify(body.refreshToken);
      if (!payload || typeof payload !== "object" || !("sub" in payload)) {
        // If token is invalid, still return 204 (idempotent)
        return new Response(null, { status: 204 });
      }

      await logoutUC.execute(
        body.refreshToken,
        payload.sub as string,
        refreshTokenRepo
      );
      return new Response(null, { status: 204 });
    },
    {
      body: RefreshTokenDto,
    }
  )
  .post(
    "/refresh",
    async ({
      body,
      refreshTokenUC,
      userRepo,
      refreshTokenRepo,
      accessJwt,
      refreshJwt,
    }) => {
      const tokens = await refreshTokenUC.execute(
        body.refreshToken,
        userRepo,
        refreshTokenRepo,
        accessJwt,
        refreshJwt
      );

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    },
    {
      body: RefreshTokenDto,
      response: RefreshTokenResponseDto,
    }
  );
