import { Controller, Post, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './local-auth.guard';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { type SafeUser } from 'src/user/types/safe-user.type';
import { CurrentUser } from './current-user.decorator';

@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@CurrentUser() user: SafeUser) {
    return this.authService.login(user);
  }

  @UseGuards(LocalAuthGuard)
  @Post('logout')
  logout() {
    return 'logout a faire';
  }
}
