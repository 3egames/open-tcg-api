import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { randomUUID } from 'crypto';
import { UserService } from 'src/user/user.service';
import { addSeconds } from 'date-fns';
/** This key references the game session state values */
const redisKeyGameSession = 'game-session';
const cfgGameSessionExpiry = 3600;
const cfgGameActionTimeoutSeconds = 30;

export interface GameLog {
  timestamp: Date;
  text: string;
}

export interface GameSession {
  currentPlayerId: string | null;
  currenActionTimeoutIn: Date;
  id: string;
  log: GameLog[];
  playerIds: string[];
  startedOn: Date;
  status: 'setup' | 'progressing' | 'ended';
}

@Injectable()
export class GameSessionService {
  constructor(
    private readonly gameSession: GameSessionService,
    private readonly redis: RedisService,
    private readonly user: UserService,
  ) {}

  /**
   * This creates a new game session and attaches the players to it.
   * @param players The players joining this game session
   * @returns Game session data
   */
  async createGameSession(playerIds: string[]) {
    // Need to make sure users have already ended their previous game sessions
    for (const pId of playerIds) {
      const user = await this.user.getUserById(pId);
      if (user.currentGameSession) {
        throw new Error(`Player #${pId}} is still in another game session.`);
      }
    }

    const now = new Date();

    const sessionData: GameSession = {
      currenActionTimeoutIn: addSeconds(
        new Date(),
        cfgGameActionTimeoutSeconds,
      ),
      currentPlayerId: null,
      id: randomUUID(),
      playerIds,
      log: [{ text: 'Game started', timestamp: now }],
      startedOn: now,
      status: 'setup',
    };

    for (const pId of playerIds) {
      await this.user.updateUserById(pId, {
        currentGameSession: sessionData.id,
      });
    }

    await this.redis.set(
      `${redisKeyGameSession}:${sessionData.id}`,
      sessionData,
      cfgGameSessionExpiry,
    );
    return sessionData;
  }

  async getGameSession(gameSessionId: string) {
    return await this.redis.get<GameSession>(
      `${redisKeyGameSession}:${gameSessionId}`,
    );
  }

  async getUserGameSession(userId: string) {
    const user = await this.user.getUserById(userId);
    if (!user?.currentGameSession) return null;
    return this.getGameSession(user.currentGameSession);
  }
}
