import { UnauthorizedError } from "../../../shared/presentation/errors";
import type {
  IRefreshTokenRepository,
  IUserRepository,
} from "../domain/auth.iface";
import type { AuthTokens } from "../domain/user.entity";

export class RefreshTokenUseCase {
  async execute(
    refreshToken: string,
    userRepo: IUserRepository,
    refreshTokenRepo: IRefreshTokenRepository,
    accessJwt: {
      sign: (payload: { sub: string; role: string }) => Promise<string>;
    },
    refreshJwt: {
      sign: (payload: { sub: string }) => Promise<string>;
      verify: (token: string) => Promise<{ sub: string } | null>;
    }
  ): Promise<AuthTokens> {
    // Verify refresh token
    const payload = await refreshJwt.verify(refreshToken);
    if (
      !payload ||
      typeof payload !== "object" ||
      !("sub" in payload) ||
      typeof payload.sub !== "string"
    ) {
      throw new UnauthorizedError([
        {
          path: "refreshToken",
          message: "Invalid refresh token",
        },
      ]);
    }

    // Get user to verify they still exist
    const user = await userRepo.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedError([
        {
          path: "user",
          message: "User not found",
        },
      ]);
    }

    // Revoke old refresh token
    await refreshTokenRepo.revokeToken(refreshToken);

    // Generate new tokens
    const accessToken = await accessJwt.sign({
      sub: user.id,
      role: user.role,
    });

    const newRefreshToken = await refreshJwt.sign({
      sub: user.id,
    });

    await refreshTokenRepo.create({
      userId: user.id,
      tokenHash: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revoked: false,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }
}
