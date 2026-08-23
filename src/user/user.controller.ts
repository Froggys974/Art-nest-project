import { Controller, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { Roles } from 'src/auth/roles.decorator';
import { type SafeUser } from './types/safe-user.type';
import { UserRole } from './user-role.enum';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: SafeUser) {
    return user;
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/validate')
  validate(@Param('id', ParseIntPipe) id: number) {
    return this.userService.validate(id);
  }
}
