import type { RefreshToken, User } from "./user.entity";

export interface IUserRepository {
	findByUsername(username: string): Promise<User | null>;
	findById(id: string): Promise<User | null>;
	create(data: Omit<User, "id"> | User): Promise<User>;
	update(id: string, data: Partial<Omit<User, "id">>): Promise<User>;
	delete(id: string): Promise<void>;
	updateLastLogin(id: string): Promise<void>;
}

export interface IRefreshTokenRepository {
	create(token: Omit<RefreshToken, "id" | "createdAt">): Promise<RefreshToken>;
	findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
	findByUserId(userId: string): Promise<RefreshToken[]>;
	revokeToken(tokenHash: string): Promise<void>;
	revokeAllUserTokens(userId: string): Promise<void>;
	deleteExpiredTokens(): Promise<void>;
}
