import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../user/user-role.enum';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const contextWithUser = (user?: { role: UserRole }): ExecutionContext =>
    ({
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(
      guard.canActivate(contextWithUser({ role: UserRole.COLLECTOR })),
    ).toBe(true);
  });

  it('allows a user having a required role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);

    expect(guard.canActivate(contextWithUser({ role: UserRole.ADMIN }))).toBe(
      true,
    );
  });

  it('denies a user without the required role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);

    expect(guard.canActivate(contextWithUser({ role: UserRole.GALLERY }))).toBe(
      false,
    );
  });

  it('denies when no user is attached to the request', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);

    expect(guard.canActivate(contextWithUser(undefined))).toBe(false);
  });
});
