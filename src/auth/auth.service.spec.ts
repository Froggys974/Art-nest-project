import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'node:crypto';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { UserRole } from '../user/user-role.enum';

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

describe('AuthService', () => {
  let service: AuthService;
  let userService: {
    findOneBy: jest.Mock;
    create: jest.Mock;
    setRefreshTokenHash: jest.Mock;
  };
  let jwtService: { sign: jest.Mock; verifyAsync: jest.Mock };

  const collector = {
    userId: 1,
    username: 'alice',
    role: UserRole.COLLECTOR,
    isValidated: true,
  };

  beforeEach(async () => {
    userService = {
      findOneBy: jest.fn(),
      create: jest.fn(),
      setRefreshTokenHash: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
      verifyAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('config-value') },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns both tokens on login and stores the refresh token hash', async () => {
    const result = await service.login(collector);

    expect(result).toEqual({
      access_token: 'signed-token',
      refresh_token: 'signed-token',
    });
    expect(userService.setRefreshTokenHash).toHaveBeenCalledWith(
      1,
      sha256('signed-token'),
    );
  });

  it('rejects registration when the username is taken', async () => {
    userService.findOneBy.mockResolvedValue({ userId: 1 });

    await expect(
      service.register({
        username: 'alice',
        password: 'password123',
        role: UserRole.COLLECTOR,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('registers a user and strips the sensitive fields', async () => {
    userService.findOneBy.mockResolvedValue(null);
    userService.create.mockResolvedValue({
      ...collector,
      password: 'hashed',
      refreshTokenHash: null,
    });

    const result = await service.register({
      username: 'alice',
      password: 'password123',
      role: UserRole.COLLECTOR,
    });

    expect(result).toEqual(collector);
  });

  it('rejects a refresh token with an invalid signature', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid signature'));

    await expect(service.refresh('bad-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a refresh token that does not match the stored hash', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 1, username: 'alice' });
    userService.findOneBy.mockResolvedValue({
      ...collector,
      password: 'hashed',
      refreshTokenHash: sha256('a-newer-token'),
    });

    await expect(service.refresh('rotated-out-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('issues new tokens for a valid refresh token', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 1, username: 'alice' });
    userService.findOneBy.mockResolvedValue({
      ...collector,
      password: 'hashed',
      refreshTokenHash: sha256('current-token'),
    });

    const result = await service.refresh('current-token');

    expect(result).toEqual({
      access_token: 'signed-token',
      refresh_token: 'signed-token',
    });
    expect(userService.setRefreshTokenHash).toHaveBeenCalledWith(
      1,
      sha256('signed-token'),
    );
  });

  it('clears the stored refresh token hash on logout', async () => {
    await service.logout(1);

    expect(userService.setRefreshTokenHash).toHaveBeenCalledWith(1, null);
  });
});
