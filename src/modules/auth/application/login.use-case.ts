import { UnauthorizedError } from "../../../shared/presentation/errors";
import type {
	IRefreshTokenRepository,
	IUserRepository,
} from "../domain/auth.iface";
import type { AuthTokens } from "../domain/user.entity";

export class LoginUseCase {
	async execute(
		username: string,
		password: string,
		userRepo: IUserRepository,
		refreshTokenRepo: IRefreshTokenRepository,
		accessJwt: {
			sign: (payload: { sub: string; role: string }) => Promise<string>;
		},
		refreshJwt: { sign: (payload: { sub: string }) => Promise<string> },
	): Promise<{
		tokens: AuthTokens;
		user: { id: string; username: string; role: string };
	}> {
		// Find user by username
		const user = await userRepo.findByUsername(username);
		if (!user) {
			throw new UnauthorizedError([
				{
					path: "username",
					message: "User not found",
				},
			]);
		}

		// Verify password using Argon2id
		try {
			const isValid = await Bun.password.verify(
				password,
				user.passwordHash,
				"argon2id",
			);
			if (!isValid) {
				throw new UnauthorizedError([
					{
						path: "password",
						message: "Invalid credentials",
					},
				]);
			}
		} catch (error) {
			// If password verification throws an error, treat as invalid credentials
			if (error instanceof UnauthorizedError) {
				throw error;
			}
			throw new UnauthorizedError([
				{
					path: "password",
					message: "Invalid credentials",
				},
			]);
		}

		// Update last login
		await userRepo.updateLastLogin(user.id);

		// Generate tokens
		const accessToken = await accessJwt.sign({
			sub: user.id,
			role: user.role,
		});

		const refreshToken = await refreshJwt.sign({
			sub: user.id,
		});

		// Hash refresh token for storage
		const refreshTokenHash = await Bun.password.hash(refreshToken, "argon2id");
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

		// Store refresh token
		await refreshTokenRepo.create({
			userId: user.id,
			tokenHash: refreshTokenHash,
			expiresAt,
			revoked: false,
		});

		return {
			tokens: {
				accessToken,
				refreshToken,
			},
			user: {
				id: user.id,
				username: user.username,
				role: user.role,
			},
		};
	}
}
