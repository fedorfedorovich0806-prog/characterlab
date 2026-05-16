import Redis from "ioredis";

type Cache = {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSec?: number): Promise<void>;
  del(key: string): Promise<void>;
};

let singleton: Cache | null = null;

function memoryCache(): Cache {
  const store = new Map<string, { value: string; expiresAt: number | null }>();
  return {
    async get<T>(key: string) {
      const item = store.get(key);
      if (!item) return null;
      if (item.expiresAt && item.expiresAt < Date.now()) {
        store.delete(key);
        return null;
      }
      try {
        return JSON.parse(item.value) as T;
      } catch {
        return null;
      }
    },
    async set(key, value, ttlSec) {
      store.set(key, {
        value: JSON.stringify(value),
        expiresAt: ttlSec ? Date.now() + ttlSec * 1000 : null,
      });
    },
    async del(key) {
      store.delete(key);
    },
  };
}

function redisCache(url: string): Cache {
  const client = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
  client.on("error", (e) => console.warn("[redis] error:", e.message));
  client.connect().catch((e) => console.warn("[redis] connect:", e.message));
  return {
    async get<T>(key: string) {
      try {
        const v = await client.get(key);
        return v ? (JSON.parse(v) as T) : null;
      } catch {
        return null;
      }
    },
    async set(key, value, ttlSec) {
      try {
        const v = JSON.stringify(value);
        if (ttlSec) await client.set(key, v, "EX", ttlSec);
        else await client.set(key, v);
      } catch {}
    },
    async del(key) {
      try {
        await client.del(key);
      } catch {}
    },
  };
}

export function getCache(): Cache {
  if (singleton) return singleton;
  const url = process.env.REDIS_URL;
  singleton = url && url.length > 0 ? redisCache(url) : memoryCache();
  return singleton;
}
