import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { type SafeUser } from './types/safe-user.type';

@Controller('user')
export class UserController {
  @Get('profile')
  getProfile(@CurrentUser() user: SafeUser) {
    return user;
  }
}
