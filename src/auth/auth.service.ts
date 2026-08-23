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

type JwtPayload = { sub: number; username: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

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

  login(user: SafeUser) {
    return this.generateTokens(user);
  }

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

    const { password, refreshTokenHash, ...safeUser } = user;
    return this.generateTokens(safeUser);
  }

  async logout(userId: number): Promise<void> {
    await this.usersService.setRefreshTokenHash(userId, null);
  }

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

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
