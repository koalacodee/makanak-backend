// src/db.ts
import { drizzle, BunSQLDatabase } from "drizzle-orm/bun-sql";

class Database {
  private static _instance: BunSQLDatabase;
  private constructor() {} // block external `new`

  public static get instance(): BunSQLDatabase {
    if (!this._instance) {
      this._instance = drizzle(process.env.DATABASE_URL!);
    }
    return this._instance;
  }
}

// export the singleton value, not the class
export default Database.instance;
