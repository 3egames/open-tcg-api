import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisDataUnprocessableError } from 'src/common/errors/redis_data_error';

export interface KeyValuePair {
  [key: string]: any;
}

@Injectable()
export class RedisService {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis();
  }

  async get<T extends KeyValuePair>(key: string): Promise<T | null> {
    const stringData = await this.redis.get(key);
    if (!stringData) return null;
    try {
      return JSON.parse(stringData) as T;
    } catch (error) {
      throw new RedisDataUnprocessableError({
        key,
        message: (error as Error).message,
      });
    }
  }

  async set<T extends KeyValuePair>(
    key: string,
    value: T,
    ttl?: number,
  ): Promise<void> {
    await this.redis.set(key, JSON.stringify(value));
    if (ttl && ttl > 0) {
      await this.redis.expire(key, ttl);
    }
  }

  async update<T extends KeyValuePair>(
    key: string,
    value: Partial<T>,
  ): Promise<void> {
    const stringData = await this.redis.get(key);
    if (!stringData) return;

    let data: T;
    try {
      data = JSON.parse(stringData) as T;
    } catch (error) {
      throw new RedisDataUnprocessableError({
        key,
        message: (error as Error).message,
      });
    }

    const updatedData: T = { ...data, ...value };
    if (JSON.stringify(data) === JSON.stringify(updatedData)) {
      return; // No changes, skip Redis write
    }

    const ttl = await this.redis.ttl(key); // get ttl info before overwrite
    await this.redis.set(key, JSON.stringify(updatedData));

    if (ttl > 0) {
      // Restore TTL if it was set before
      await this.redis.expire(key, ttl);
    }
  }
}
