import { Controller, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { Roles } from 'src/auth/roles.decorator';
import { type SafeUser } from './types/safe-user.type';
import { UserRole } from './user-role.enum';
import { UserService } from './user.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get the current authenticated user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile (no password, no refresh token hash)',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid token' })
  getProfile(@CurrentUser() user: SafeUser) {
    return user;
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/validate')
  @ApiOperation({ summary: 'Validate a gallery user account (admin only)' })
  @ApiParam({ name: 'id', type: Number, example: 2 })
  @ApiResponse({
    status: 200,
    description: 'Account validated — gallery can now log in',
  })
  @ApiResponse({ status: 403, description: 'Forbidden — admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  validate(@Param('id', ParseIntPipe) id: number) {
    return this.userService.validate(id);
  }
}
