// src/db.ts
import { BunSQLDatabase, drizzle } from "drizzle-orm/bun-sql";
import * as schema from "./schema";
class Database {
  private static _instance: BunSQLDatabase<typeof schema> & {
    $client: Bun.SQL;
  };
  private constructor() {} // block external `new`

  public static get instance() {
    if (!this._instance) {
      this._instance = drizzle(process.env.DATABASE_URL!, {
        schema: schema,
      });
    }
    return this._instance;
  }
}

// export the singleton value, not the class
export default Database.instance;
