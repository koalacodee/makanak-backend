import type {
  IUserRepository,
  IRefreshTokenRepository,
} from "../domain/auth.iface";
import type { AuthTokens } from "../domain/user.entity";
import { UnauthorizedError } from "../../../shared/presentation/errors";

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
      verify: (token: string) => Promise<any>;
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

    // Get user's refresh tokens and verify the provided token matches one of them
    const userTokens = await refreshTokenRepo.findByUserId(payload.sub);
    let storedToken = null;

    for (const token of userTokens) {
      const isValid = await Bun.password.verify(
        refreshToken,
        token.tokenHash,
        "argon2id"
      );
      if (isValid) {
        storedToken = token;
        break;
      }
    }

    if (!storedToken) {
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
    await refreshTokenRepo.revokeToken(storedToken.tokenHash);

    // Generate new tokens
    const accessToken = await accessJwt.sign({
      sub: user.id,
      role: user.role,
    });

    const newRefreshToken = await refreshJwt.sign({
      sub: user.id,
    });

    // Hash and store new refresh token
    const newRefreshTokenHash = await Bun.password.hash(
      newRefreshToken,
      "argon2id"
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await refreshTokenRepo.create({
      userId: user.id,
      tokenHash: newRefreshTokenHash,
      expiresAt,
      revoked: false,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }
}
