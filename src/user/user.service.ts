import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { randomUUID } from 'crypto';
import { UserNotFoundError } from 'src/common/errors/user_not_found';
import { UserCreateNameConflictError } from 'src/common/errors/user_create_name_conflict';
/** This key identifies with what game session id the user is involved in */
const redisKeyUsernameList = 'usernames';
const redisKeyUsers = 'users';

export interface UsernameListItem {
  id: string;
}

export interface User {
  id: string;
  name: string;
  currentGameSession?: string;
}

@Injectable()
export class UserService {
  constructor(private readonly redis: RedisService) {}

  async createUser(username: string) {
    try {
      // Need to make sure username is not in use
      const userId = await this.redis.get(
        `${redisKeyUsernameList}:${username}`,
      );

      if (userId) {
        throw new UserCreateNameConflictError({ username });
      }

      const userData: User = {
        id: randomUUID(),
        name: username,
      };

      const usernameListyEntry: UsernameListItem = { id: userData.id };

      await this.redis.set<User>(`${redisKeyUsers}:${userData.id}`, userData);
      await this.redis.set<UsernameListItem>(
        `${redisKeyUsernameList}:${username}`,
        usernameListyEntry,
      );

      return userData;
    } catch (error) {
      if (error instanceof UserCreateNameConflictError) {
        throw new ConflictException(`Username #${username} already in use.`);
      }
      throw error;
    }
  }

  async getUserById(id: string) {
    try {
      const user = await this.redis.get<User>(`${redisKeyUsers}:${id}`);
      if (!user) throw new UserNotFoundError({ userId: id });
      return user;
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException(`User #${id} not found`);
      }
      throw error;
    }
  }

  async updateUserById(id: string, updates: Partial<User>) {
    await this.redis.update<User>(`${redisKeyUsers}:${id}`, updates);
  }
}
