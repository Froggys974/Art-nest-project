import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SafeUser } from 'src/user/types/safe-user.type';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  /**
   * Validates username and password credentials.
   * @param username - The username to validate
   * @param password - The password to validate
   * @returns Safe user object if credentials are valid
   * @throws {UnauthorizedException} If credentials are invalid
   */
  async validate(username: string, password: string): Promise<SafeUser> {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
