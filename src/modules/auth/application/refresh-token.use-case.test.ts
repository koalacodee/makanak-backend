import { describe, it, expect, beforeEach, mock } from "bun:test";
import { RefreshTokenUseCase } from "./refresh-token.use-case";
import type {
  IUserRepository,
  IRefreshTokenRepository,
} from "../domain/auth.iface";
import type { User, RefreshToken } from "../domain/user.entity";
import { UnauthorizedError } from "../../../shared/presentation/errors";

describe("RefreshTokenUseCase", () => {
  let useCase: RefreshTokenUseCase;
  let mockUserRepo: IUserRepository;
  let mockRefreshTokenRepo: IRefreshTokenRepository;
  let mockAccessJwt: { sign: ReturnType<typeof mock> };
  let mockRefreshJwt: {
    sign: ReturnType<typeof mock>;
    verify: ReturnType<typeof mock>;
  };

  beforeEach(() => {
    useCase = new RefreshTokenUseCase();
    mockUserRepo = {
      findById: mock(() => Promise.resolve(null)),
      findByUsername: mock(() => Promise.resolve(null)),
      updateLastLogin: mock(() => Promise.resolve()),
    };
    mockRefreshTokenRepo = {
      create: mock(() => Promise.resolve({} as RefreshToken)),
      findByTokenHash: mock(() => Promise.resolve(null)),
      findByUserId: mock(() => Promise.resolve([])),
      revokeToken: mock(() => Promise.resolve()),
      revokeAllUserTokens: mock(() => Promise.resolve()),
      deleteExpiredTokens: mock(() => Promise.resolve()),
    };
    mockAccessJwt = {
      sign: mock(() => Promise.resolve("new-access-token")),
    };
    mockRefreshJwt = {
      sign: mock(() => Promise.resolve("new-refresh-token")),
      verify: mock(() => Promise.resolve({ sub: "user-1" })),
    };
  });

  it("should refresh tokens successfully", async () => {
    const refreshToken = "valid-refresh-token";
    const tokenHash = await Bun.password.hash(refreshToken, "argon2id");

    const mockUser: User = {
      id: "user-1",
      username: "testuser",
      passwordHash: "hashed-password",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    };

    const mockStoredToken: RefreshToken = {
      id: "token-1",
      userId: "user-1",
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revoked: false,
      createdAt: new Date(),
    };

    mockUserRepo.findById = mock(() => Promise.resolve(mockUser));
    mockRefreshTokenRepo.findByUserId = mock(() =>
      Promise.resolve([mockStoredToken])
    );

    const result = await useCase.execute(
      refreshToken,
      mockUserRepo,
      mockRefreshTokenRepo,
      mockAccessJwt,
      mockRefreshJwt
    );

    expect(result.accessToken).toBe("new-access-token");
    expect(result.refreshToken).toBe("new-refresh-token");
    expect(mockRefreshTokenRepo.findByUserId).toHaveBeenCalledWith("user-1");
    expect(mockRefreshTokenRepo.revokeToken).toHaveBeenCalledWith(tokenHash);
    expect(mockRefreshTokenRepo.create).toHaveBeenCalled();
  });

  it("should throw UnauthorizedError when token is invalid", async () => {
    mockRefreshJwt.verify = mock(() => Promise.resolve(null));

    await expect(
      useCase.execute(
        "invalid-token",
        mockUserRepo,
        mockRefreshTokenRepo,
        mockAccessJwt,
        mockRefreshJwt
      )
    ).rejects.toThrow(UnauthorizedError);
  });

  it("should throw UnauthorizedError when token not found in database", async () => {
    const mockUser: User = {
      id: "user-1",
      username: "testuser",
      passwordHash: "hashed-password",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    };

    mockUserRepo.findById = mock(() => Promise.resolve(mockUser));
    mockRefreshTokenRepo.findByUserId = mock(() => Promise.resolve([]));

    await expect(
      useCase.execute(
        "token-not-in-db",
        mockUserRepo,
        mockRefreshTokenRepo,
        mockAccessJwt,
        mockRefreshJwt
      )
    ).rejects.toThrow(UnauthorizedError);
  });

  it("should throw UnauthorizedError when user not found", async () => {
    const refreshToken = "valid-refresh-token";
    const tokenHash = await Bun.password.hash(refreshToken, "argon2id");

    const mockStoredToken: RefreshToken = {
      id: "token-1",
      userId: "user-1",
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revoked: false,
      createdAt: new Date(),
    };

    mockUserRepo.findById = mock(() => Promise.resolve(null));
    mockRefreshTokenRepo.findByUserId = mock(() =>
      Promise.resolve([mockStoredToken])
    );

    await expect(
      useCase.execute(
        refreshToken,
        mockUserRepo,
        mockRefreshTokenRepo,
        mockAccessJwt,
        mockRefreshJwt
      )
    ).rejects.toThrow(UnauthorizedError);
  });
});
