import { Around, JoinPoint } from "@decorators/aspect.decorator";

interface CacheEntry {
    value: unknown;
    expiresAt: number;
}

const cacheStore = new Map<string, CacheEntry>();

export class CacheManager {
    get<T>(key: string): T | undefined {
        const entry = cacheStore.get(key);
        if (!entry) return undefined;

        if (entry.expiresAt <= Date.now()) {
            cacheStore.delete(key);
            return undefined;
        }

        return entry.value as T;
    }

    set(key: string, value: unknown, ttlSeconds: number): void {
        cacheStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    }

    evict(prefix: string): void {
        for (const key of cacheStore.keys()) {
            if (key === prefix || key.startsWith(`${prefix}:`)) {
                cacheStore.delete(key);
            }
        }
    }

    sweep(): number {
        const now = Date.now();
        let removed = 0;
        for (const [key, entry] of cacheStore.entries()) {
            if (entry.expiresAt <= now) {
                cacheStore.delete(key);
                removed++;
            }
        }
        return removed;
    }

    clear(): void {
        cacheStore.clear();
    }
}

export const cacheManager = new CacheManager();

function buildCacheKey(cacheName: string, joinPoint: JoinPoint): string {
    return `${cacheName}:${joinPoint.className}.${joinPoint.methodName}:${JSON.stringify(joinPoint.args)}`;
}

export function Cacheable(cacheName: string, ttlSeconds: number = 60) {
    return Around(async (joinPoint, proceed) => {
        const key = buildCacheKey(cacheName, joinPoint);

        const cached = cacheManager.get(key);
        if (cached !== undefined) {
            return cached;
        }

        const result = await proceed();
        cacheManager.set(key, result, ttlSeconds);
        return result;
    });
}

export function CacheEvict(cacheName: string) {
    return Around(async (joinPoint, proceed) => {
        const result = await proceed();
        cacheManager.evict(cacheName);
        return result;
    });
}
