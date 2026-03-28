import NodeCache from 'node-cache';

class CacheService {
  private static INSTANCE: CacheService;
  private cache: NodeCache;
  private defaultTTL: number;

  public static getInstance(): CacheService {
    if (!CacheService.INSTANCE) {
      CacheService.INSTANCE = new CacheService();
    }
    return CacheService.INSTANCE;
  }

  constructor() {
    this.defaultTTL = parseInt(process.env.CACHE_TTL || '3600');
    this.cache = new NodeCache({
      stdTTL: this.defaultTTL,
      checkperiod: 600,
      useClones: false,
    });
  }

  public get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  public set<T>(key: string, value: T, ttl?: number): boolean {
    if (ttl) {
      return this.cache.set(key, value, ttl);
    }
    return this.cache.set(key, value);
  }

  public has(key: string): boolean {
    return this.cache.has(key);
  }

  public del(key: string): number {
    return this.cache.del(key);
  }

  public delByPattern(pattern: string): number {
    const keys = this.cache.keys().filter((key) => key.startsWith(pattern));
    return this.cache.del(keys);
  }

  public flush(): void {
    this.cache.flushAll();
  }

  public getStats(): NodeCache.Stats {
    return this.cache.getStats();
  }

  public async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await fetchFn();
    this.set(key, value, ttl);
    return value;
  }

  public generateKey(...parts: (string | number)[]): string {
    return parts.join(':');
  }

  public invalidateUserCache(userId: string): void {
    this.delByPattern(`user:${userId}`);
  }

  public invalidateProjectCache(projectId: string): void {
    this.delByPattern(`project:${projectId}`);
  }

  public invalidateFreelancerCache(freelancerId: string): void {
    this.delByPattern(`freelancer:${freelancerId}`);
  }

  public invalidateCompanyCache(companyId: string): void {
    this.delByPattern(`company:${companyId}`);
  }
}

export default CacheService.getInstance();
