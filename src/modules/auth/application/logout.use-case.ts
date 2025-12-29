import type { IRefreshTokenRepository } from "../domain/auth.iface";

export class LogoutUseCase {
	async execute(
		refreshToken: string,
		userId: string,
		refreshTokenRepo: IRefreshTokenRepository,
	): Promise<void> {
		// Get user's refresh tokens and find the matching one
		const userTokens = await refreshTokenRepo.findByUserId(userId);

		for (const token of userTokens) {
			const isValid = await Bun.password.verify(
				refreshToken,
				token.tokenHash,
				"argon2id",
			);
			if (isValid) {
				await refreshTokenRepo.revokeToken(token.tokenHash);
				return;
			}
		}
	}
}
