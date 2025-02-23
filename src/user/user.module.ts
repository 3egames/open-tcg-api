import { Module } from '@nestjs/common';
import { RedisModule } from 'src/redis/redis.module';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [UserController],
  imports: [AuthModule, RedisModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
