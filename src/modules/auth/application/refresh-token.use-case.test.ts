import { beforeEach, describe, expect, it, mock } from "bun:test";
import { UnauthorizedError } from "../../../shared/presentation/errors";
import type {
	IRefreshTokenRepository,
	IUserRepository,
} from "../domain/auth.iface";
import type { RefreshToken, User } from "../domain/user.entity";
import { RefreshTokenUseCase } from "./refresh-token.use-case";

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
			create: mock(() => Promise.resolve({} as User)),
			update: mock(() => Promise.resolve({} as User)),
			delete: mock(() => Promise.resolve()),
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

		const result = await useCase.execute(
			refreshToken,
			mockUserRepo,
			mockRefreshTokenRepo,
			mockAccessJwt,
			mockRefreshJwt,
		);

		expect(result.accessToken).toBe("new-access-token");
		expect(result.refreshToken).toBe("new-refresh-token");
		expect(mockUserRepo.findById).toHaveBeenCalledWith("user-1");
		expect(mockRefreshTokenRepo.revokeToken).toHaveBeenCalledWith(refreshToken);
		expect(mockRefreshTokenRepo.create).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: "user-1",
				tokenHash: refreshToken,
				revoked: false,
			}),
		);
	});

	it("should throw UnauthorizedError when token is invalid (null)", async () => {
		mockRefreshJwt.verify = mock(() => Promise.resolve(null));

		await expect(
			useCase.execute(
				"invalid-token",
				mockUserRepo,
				mockRefreshTokenRepo,
				mockAccessJwt,
				mockRefreshJwt,
			),
		).rejects.toThrow(UnauthorizedError);
	});

	it("should throw UnauthorizedError when token payload is not an object", async () => {
		mockRefreshJwt.verify = mock(() => Promise.resolve("not-an-object"));

		await expect(
			useCase.execute(
				"invalid-token",
				mockUserRepo,
				mockRefreshTokenRepo,
				mockAccessJwt,
				mockRefreshJwt,
			),
		).rejects.toThrow(UnauthorizedError);
	});

	it("should throw UnauthorizedError when token payload lacks sub field", async () => {
		mockRefreshJwt.verify = mock(() => Promise.resolve({ role: "admin" }));

		await expect(
			useCase.execute(
				"invalid-token",
				mockUserRepo,
				mockRefreshTokenRepo,
				mockAccessJwt,
				mockRefreshJwt,
			),
		).rejects.toThrow(UnauthorizedError);
	});

	it("should throw UnauthorizedError when token payload sub is not a string", async () => {
		mockRefreshJwt.verify = mock(() => Promise.resolve({ sub: 123 }));

		await expect(
			useCase.execute(
				"invalid-token",
				mockUserRepo,
				mockRefreshTokenRepo,
				mockAccessJwt,
				mockRefreshJwt,
			),
		).rejects.toThrow(UnauthorizedError);
	});

	it("should throw UnauthorizedError when user not found", async () => {
		const refreshToken = "valid-refresh-token";

		mockUserRepo.findById = mock(() => Promise.resolve(null));

		await expect(
			useCase.execute(
				refreshToken,
				mockUserRepo,
				mockRefreshTokenRepo,
				mockAccessJwt,
				mockRefreshJwt,
			),
		).rejects.toThrow(UnauthorizedError);
		expect(mockUserRepo.findById).toHaveBeenCalledWith("user-1");
	});
});
