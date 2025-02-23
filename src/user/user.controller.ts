import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserPayloadDto } from './user.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AccessToken } from 'src/auth/auth.decorator';
import { AuthService } from 'src/auth/auth.service';

@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly auth: AuthService,
    private readonly user: UserService,
  ) {}

  @Get('/info')
  async getUserinfo(@AccessToken() accessToken: string) {
    return await this.auth.getCurrentUserAuth0Info(accessToken);
  }

  @Get(':userId')
  async getUser(@Param('userId') userId: string) {
    return await this.user.getUserById(userId);
  }

  @Post()
  async createUser(@Body() payload: CreateUserPayloadDto) {
    return await this.user.createUser(payload.name);
  }
}
