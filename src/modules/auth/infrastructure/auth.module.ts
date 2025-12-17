import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import db from "../../../drizzle";
import { UserRepository } from "./user.repository";
import { RefreshTokenRepository } from "./refreshToken.repository";
import { LoginUseCase } from "../application/login.use-case";
import { LogoutUseCase } from "../application/logout.use-case";
import { RefreshTokenUseCase } from "../application/refresh-token.use-case";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

export const authModule = new Elysia({ name: "authModule" })
  .use(
    jwt({
      name: "accessJwt",
      secret: JWT_SECRET,
      exp: "15m", // Access token TTL
    })
  )
  .use(
    jwt({
      name: "refreshJwt",
      secret: JWT_SECRET,
      exp: "7d", // Refresh token TTL
    })
  )
  .decorate("userRepo", new UserRepository(db))
  .decorate("refreshTokenRepo", new RefreshTokenRepository(db))
  .decorate("loginUC", new LoginUseCase())
  .decorate("logoutUC", new LogoutUseCase())
  .decorate("refreshTokenUC", new RefreshTokenUseCase());
