// src/db.ts

import { SQL } from "bun";
import { type BunSQLDatabase, drizzle } from "drizzle-orm/bun-sql";
import { migrate } from "drizzle-orm/bun-sql/migrator";
import * as schema from "./schema";
export class Database {
	private static _instance: BunSQLDatabase<typeof schema> & {
		$client: Bun.SQL;
	};
	private constructor() {} // block external `new`

	public static get instance() {
		if (!Database._instance) {
			const databaseUrl = process.env.DATABASE_URL;
			if (!databaseUrl) {
				throw new Error("DATABASE_URL environment variable is not set");
			}
			Database._instance = drizzle(
				new SQL({
					url: databaseUrl,
					max: 20, // Maximum number of connections in the pool
					idleTimeout: 30, // Close idle connections after 30 seconds
					connectionTimeout: 10, // Timeout for establishing new connections
				}),
				{
					schema: schema,
				},
			);
		}
		return Database._instance;
	}

	public static async migrate() {
		const databaseUrl = process.env.DATABASE_URL;
		if (!databaseUrl) {
			throw new Error("DATABASE_URL environment variable is not set");
		}
		await waitForDatabase(databaseUrl)
			.then(async () => {
				await migrate(Database.instance, { migrationsFolder: "drizzle" })
					.then(() => {
						console.log("Migrations applied successfully");
					})
					.catch((error) => {
						console.error("Failed to apply migrations:", error);
					});
			})
			.catch((error) => {
				console.error("Failed to connect to the database:", error);
			});
	}
}

async function waitForDatabase(url: string, maxAttempts = 10, interval = 3000) {
	let attempts = 0;

	while (attempts < maxAttempts) {
		try {
			// Create a new SQL instance with the provided URL
			const db = new SQL(url);

			// Attempt to connect to the database
			await db`SELECT 1`;
			console.log("Database is ready!");
			return true;
		} catch (_error) {
			console.log("Database is not ready yet. Retrying...");
			attempts++;
			await new Promise((resolve) => setTimeout(resolve, interval));
		}
	}

	console.error("Failed to connect to the database after multiple attempts.");
	return false;
}

// export the singleton value, not the class
export default Database.instance;
