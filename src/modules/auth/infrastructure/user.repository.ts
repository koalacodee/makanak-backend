import { eq } from "drizzle-orm";
import type db from "../../../drizzle";
import { users } from "../../../drizzle/schema/users";
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

	async create(data: Omit<User, "id"> | User): Promise<User> {
		const userId = "id" in data && data.id ? data.id : Bun.randomUUIDv7();

		const [result] = await this.database
			.insert(users)
			.values({
				id: userId,
				username: data.username,
				passwordHash: data.passwordHash,
				role: data.role,
				createdAt: data.createdAt || new Date(),
				updatedAt: data.updatedAt || new Date(),
				lastLoginAt: data.lastLoginAt || null,
			})
			.returning();

		return this.mapToEntity(result);
	}

	async update(id: string, data: Partial<Omit<User, "id">>): Promise<User> {
		const updateData: {
			username?: string;
			passwordHash?: string;
			role?: "admin" | "driver" | "cs" | "inventory";
			updatedAt?: Date;
		} = {};
		if (data.username !== undefined) updateData.username = data.username;
		if (data.passwordHash !== undefined)
			updateData.passwordHash = data.passwordHash;
		if (data.role !== undefined) updateData.role = data.role;
		updateData.updatedAt = new Date();

		const [result] = await this.database
			.update(users)
			.set(updateData)
			.where(eq(users.id, id))
			.returning();

		return this.mapToEntity(result);
	}

	async delete(id: string): Promise<void> {
		await this.database.delete(users).where(eq(users.id, id));
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
