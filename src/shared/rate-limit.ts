import type { Context, Options } from 'elysia-rate-limit'
import redis from './redis'

export class RedisContext implements Context {
  private ttl: number = 0
  // class initialization for creating context
  init(options: Omit<Options, 'context'>): void {
    this.ttl = options.duration
  }

  async increment(key: string): Promise<{ count: number; nextReset: Date }> {
    const bucketKey = `rate-limit:${key}`

    const lua = `
      local count = redis.call("INCR", KEYS[1])
      local ttl = redis.call("TTL", KEYS[1])
      if count == 1 and ttl == -1 then
        redis.call("EXPIRE", KEYS[1], ARGV[1])
      end
      return {count, ttl}
    `

    const [countStr, ttl] = await redis.send('EVAL', [
      lua,
      '1',
      bucketKey,
      this.ttl.toString(),
    ])

    const ttlSeconds = Number(ttl) > 0 ? Number(ttl) : this.ttl
    return {
      count: Number(countStr),
      nextReset: new Date(Date.now() + ttlSeconds * 1000),
    }
  }

  // function will be called to deduct count in case of request failure
  async decrement(key: string): Promise<void> {
    const bucketKey = `rate-limit:${key}`
    await redis.decr(bucketKey)
  }

  // if key specified, it will reset count for only specific user, otherwise clear entire storage
  async reset(key?: string): Promise<void> {
    if (key) {
      const bucketKey = `rate-limit:${key}`
      await redis.del(bucketKey)
    } else {
      const pattern = 'rate-limit:*'
      let cursor = '0'

      do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern)
        cursor = nextCursor

        if (keys.length) {
          // Bun’s client accepts spread arguments
          await redis.del(...keys)
        }
      } while (cursor !== '0')
    }
  }

  // cleanup function on process killed
  async kill(): Promise<void> {
    await this.reset()
  }
}
