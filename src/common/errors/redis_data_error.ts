import { ErrorData, OpenTCGError } from './open_tcg_errors';

export class RedisDataUnprocessableError extends OpenTCGError {
  constructor(data: ErrorData) {
    super('Redis data unprocessable', 'USR422', data);
  }
}
