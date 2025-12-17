class Redis extends Bun.RedisClient {
  private static _instance: Redis | null = null;

  private constructor() {
    super(process.env.REDIS_URL ?? undefined);
  }

  public static instance(): Redis {
    if (!this._instance) {
      this._instance = new Redis();
    }
    return this._instance;
  }
}

export default Redis.instance();
