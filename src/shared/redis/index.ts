class Redis extends Bun.RedisClient {
  private static _instance: Redis | null = null

  private constructor() {
    super(process.env.REDIS_URL ?? undefined)
  }

  public static instance(): Redis {
    if (!Redis._instance) {
      Redis._instance = new Redis()
    }
    return Redis._instance
  }
}

export default Redis.instance()
