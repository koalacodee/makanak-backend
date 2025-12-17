import { eq } from "drizzle-orm";
import { users } from "../../../drizzle/schema/users";
import db from "../../../drizzle";
import type { IUserRepository } from "../domain/auth.iface";
import type { User } from "../domain/user.entity";

export class UserRepository implements IUserRepository {
  constructor(private database: typeof db) {}

  async findByUsername(username: string): Promise<User | null> {
    const result = await this.database
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.mapToEntity(result[0]);
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.database
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.mapToEntity(result[0]);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.database
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, id));
  }

  private mapToEntity(row: typeof users.$inferSelect): User {
    return {
      id: row.id,
      username: row.username,
      passwordHash: row.passwordHash,
      role: row.role,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      lastLoginAt: row.lastLoginAt,
    };
  }
}
