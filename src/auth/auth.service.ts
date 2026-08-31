import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'node:crypto';
import { UserService } from 'src/user/user.service';
import { SafeUser } from 'src/user/types/safe-user.type';
import { UserRole } from 'src/user/user-role.enum';
import { RegisterDto } from './dto/register.dto';

/**
 * JWT payload structure containing user identification.
 */
type JwtPayload = { sub: number; username: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Validates user credentials and returns safe user data if valid.
   * @param username - The username to validate
   * @param pass - The password to validate
   * @returns Safe user object if credentials are valid, null otherwise
   * @throws {ForbiddenException} If gallery account is not yet validated by admin
   */
  async validateUser(username: string, pass: string): Promise<SafeUser | null> {
    const user = await this.usersService.findOneBy({ username });
    if (!user || !(await bcrypt.compare(pass, user.password))) {
      return null;
    }
    if (user.role === UserRole.GALLERY && !user.isValidated) {
      throw new ForbiddenException('Gallery account awaiting admin validation');
    }
    const { password, refreshTokenHash, ...result } = user;
    return result;
  }

  /**
   * Registers a new user account.
   * @param dto - Registration data containing username, password, and role
   * @returns Safe user object without sensitive fields
   * @throws {ConflictException} If username is already taken
   */
  async register(dto: RegisterDto): Promise<SafeUser> {
    const existing = await this.usersService.findOneBy({
      username: dto.username,
    });
    if (existing) {
      throw new ConflictException('Username already taken');
    }
    const user = await this.usersService.create(
      dto.username,
      dto.password,
      dto.role,
    );
    const { password, refreshTokenHash, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Generates access and refresh tokens for a logged-in user.
   * @param user - The authenticated user
   * @returns Object containing access_token and refresh_token
   */
  login(user: SafeUser) {
    return this.generateTokens(user);
  }

  /**
   * Refreshes access and refresh tokens using a valid refresh token.
   * @param refreshToken - The refresh token to validate
   * @returns Object containing new access_token and refresh_token
   * @throws {UnauthorizedException} If refresh token is invalid or expired
   * @throws {ForbiddenException} If gallery account is not yet validated by admin
   */
  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findOneBy({ userId: payload.sub });
    if (!user || user.refreshTokenHash !== this.hashToken(refreshToken)) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (user.role === UserRole.GALLERY && !user.isValidated) {
      throw new ForbiddenException('Gallery account awaiting admin validation');
    }

    const { password, refreshTokenHash, ...safeUser } = user;
    return this.generateTokens(safeUser);
  }

  /**
   * Logs out a user by invalidating their refresh token.
   * @param userId - The ID of the user to log out
   */
  async logout(userId: number): Promise<void> {
    await this.usersService.setRefreshTokenHash(userId, null);
  }

  /**
   * Generates new access and refresh tokens for a user and stores the refresh token hash.
   * @param user - The user to generate tokens for
   * @returns Object containing access_token and refresh_token
   */
  private async generateTokens(user: SafeUser) {
    const payload: JwtPayload = { sub: user.userId, username: user.username };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN'),
    } as JwtSignOptions);
    await this.usersService.setRefreshTokenHash(
      user.userId,
      this.hashToken(refreshToken),
    );
    return { access_token: accessToken, refresh_token: refreshToken };
  }

  /**
   * Hashes a token using SHA-256.
   * @param token - The token to hash
   * @returns The hexadecimal hash of the token
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
