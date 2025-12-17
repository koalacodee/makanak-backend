import { describe, it, expect, beforeEach, mock } from "bun:test";
import { LogoutUseCase } from "./logout.use-case";
import type { IRefreshTokenRepository } from "../domain/auth.iface";
import type { RefreshToken } from "../domain/user.entity";

describe("LogoutUseCase", () => {
  let useCase: LogoutUseCase;
  let mockRefreshTokenRepo: IRefreshTokenRepository;

  beforeEach(() => {
    useCase = new LogoutUseCase();
    mockRefreshTokenRepo = {
      create: mock(() => Promise.resolve({} as RefreshToken)),
      findByTokenHash: mock(() => Promise.resolve(null)),
      findByUserId: mock(() => Promise.resolve([])),
      revokeToken: mock(() => Promise.resolve()),
      revokeAllUserTokens: mock(() => Promise.resolve()),
      deleteExpiredTokens: mock(() => Promise.resolve()),
    };
  });

  it("should revoke refresh token successfully when found", async () => {
    const refreshToken = "valid-refresh-token";
    const tokenHash = await Bun.password.hash(refreshToken, "argon2id");

    const mockTokens: RefreshToken[] = [
      {
        id: "token-1",
        userId: "user-1",
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revoked: false,
        createdAt: new Date(),
      },
    ];

    mockRefreshTokenRepo.findByUserId = mock(() => Promise.resolve(mockTokens));

    await useCase.execute(refreshToken, "user-1", mockRefreshTokenRepo);

    expect(mockRefreshTokenRepo.findByUserId).toHaveBeenCalledWith("user-1");
    expect(mockRefreshTokenRepo.revokeToken).toHaveBeenCalledWith(tokenHash);
  });

  it("should handle logout gracefully when token not found", async () => {
    const refreshToken = "invalid-refresh-token";
    const otherTokenHash = await Bun.password.hash("other-token", "argon2id");

    const mockTokens: RefreshToken[] = [
      {
        id: "token-1",
        userId: "user-1",
        tokenHash: otherTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revoked: false,
        createdAt: new Date(),
      },
    ];

    mockRefreshTokenRepo.findByUserId = mock(() => Promise.resolve(mockTokens));

    await useCase.execute(refreshToken, "user-1", mockRefreshTokenRepo);

    expect(mockRefreshTokenRepo.findByUserId).toHaveBeenCalledWith("user-1");
    expect(mockRefreshTokenRepo.revokeToken).not.toHaveBeenCalled();
  });

  it("should handle empty token list", async () => {
    mockRefreshTokenRepo.findByUserId = mock(() => Promise.resolve([]));

    await useCase.execute("any-token", "user-1", mockRefreshTokenRepo);

    expect(mockRefreshTokenRepo.findByUserId).toHaveBeenCalledWith("user-1");
    expect(mockRefreshTokenRepo.revokeToken).not.toHaveBeenCalled();
  });
});
