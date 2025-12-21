import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import type { UserRole } from "../domain/user.entity";
import { UnauthorizedError } from "../../../shared/presentation/errors";
import bearer from "@elysiajs/bearer";

export const authGuard = (allowedRoles?: UserRole[]) => {
  return new Elysia({ name: "authGuard" })
    .use(bearer())
    .use(
      jwt({
        name: "accessJwt",
        secret: process.env.JWT_SECRET || "change-me-in-production",
      })
    )
    .derive({ as: "scoped" }, async ({ accessJwt, headers }) => {
      const authHeader = headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedError([
          {
            path: "authorization",
            message: "Missing or invalid authorization header",
          },
        ]);
      }

      const token = authHeader.substring(7);
      const payload = await accessJwt.verify(token);

      if (!payload || typeof payload !== "object" || !("sub" in payload)) {
        throw new UnauthorizedError([
          {
            path: "authorization",
            message: "Invalid token",
          },
        ]);
      }

      const userId = payload.sub as string;
      const role = (payload.role as UserRole) || undefined;
      console.log(role);

      // Check role if specified
      if (allowedRoles && role && !allowedRoles.includes(role)) {
        throw new UnauthorizedError([
          {
            path: "authorization",
            message: "Insufficient permissions",
          },
        ]);
      }

      return {
        user: {
          id: userId,
          role: role as UserRole,
        },
      };
    });
};
