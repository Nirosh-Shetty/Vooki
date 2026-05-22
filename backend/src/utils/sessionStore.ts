import Redis from "ioredis";
import crypto from "crypto";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const sessionStore = {
  async set(data: any, ttl: number): Promise<string> {
    if (!data || typeof data !== "object") {
      throw new Error("Data must be a non-empty object");
    }
    const sessionId = crypto.randomBytes(32).toString("hex");
    await redis.set(sessionId, JSON.stringify(data), "EX", ttl);
    return sessionId;
  },

  async get(sessionId: string): Promise<any | null> {
    const data = await redis.get(sessionId);
    return data ? JSON.parse(data) : null;
  },

  async delete(sessionId: string): Promise<void> {
    await redis.del(sessionId);
  },
  async setWithKey(key: string, data: any, ttl: number): Promise<void> {
    await redis.set(key, JSON.stringify(data), "EX", ttl);
  },
  async deleteByKey(key: string): Promise<void> {
    await redis.del(key);
  },
};

export default sessionStore;
