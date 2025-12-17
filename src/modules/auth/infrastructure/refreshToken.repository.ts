import { eq, and, lt } from "drizzle-orm";
import { refreshTokens } from "../../../drizzle/schema";
import db from "../../../drizzle";
import type { IRefreshTokenRepository } from "../domain/auth.iface";
import type { RefreshToken } from "../domain/user.entity";

export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private database: typeof db) {}

  async create(
    token: Omit<RefreshToken, "id" | "createdAt">
  ): Promise<RefreshToken> {
    const id = Bun.randomUUIDv7();

    const [result] = await this.database
      .insert(refreshTokens)
      .values({
        id,
        userId: token.userId,
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
        revoked: token.revoked,
      })
      .returning();

    return this.mapToEntity(result);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const result = await this.database
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.tokenHash, tokenHash),
          eq(refreshTokens.revoked, false)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const token = this.mapToEntity(result[0]);

    // Check if token is expired
    if (token.expiresAt < new Date()) {
      return null;
    }

    return token;
  }

  async findByUserId(userId: string): Promise<RefreshToken[]> {
    const result = await this.database
      .select()
      .from(refreshTokens)
      .where(
        and(eq(refreshTokens.userId, userId), eq(refreshTokens.revoked, false))
      );

    return result.map(this.mapToEntity);
  }

  async revokeToken(tokenHash: string): Promise<void> {
    await this.database
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.tokenHash, tokenHash));
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.database
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.userId, userId));
  }

  async deleteExpiredTokens(): Promise<void> {
    await this.database
      .delete(refreshTokens)
      .where(lt(refreshTokens.expiresAt, new Date()));
  }

  private mapToEntity(row: typeof refreshTokens.$inferSelect): RefreshToken {
    return {
      id: row.id,
      userId: row.userId,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      revoked: row.revoked,
      createdAt: row.createdAt,
    };
  }
}
