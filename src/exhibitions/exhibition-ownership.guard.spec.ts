import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRole } from '../user/user-role.enum';
import { Exhibition } from './exhibition.entity';
import { ExhibitionOwnershipGuard } from './exhibition-ownership.guard';

describe('ExhibitionOwnershipGuard', () => {
  let guard: ExhibitionOwnershipGuard;
  let exhibitionRepository: { findOneBy: jest.Mock };

  const contextFor = (
    user: { userId: number; role: UserRole } | undefined,
    id = '1',
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user, params: { id } }) }),
    }) as unknown as ExecutionContext;

  beforeEach(async () => {
    exhibitionRepository = { findOneBy: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExhibitionOwnershipGuard,
        {
          provide: getRepositoryToken(Exhibition),
          useValue: exhibitionRepository,
        },
      ],
    }).compile();

    guard = module.get<ExhibitionOwnershipGuard>(ExhibitionOwnershipGuard);
  });

  it('allows the gallery owning the exhibition', async () => {
    exhibitionRepository.findOneBy.mockResolvedValue({ id: 1, galleryId: 10 });

    await expect(
      guard.canActivate(contextFor({ userId: 10, role: UserRole.GALLERY })),
    ).resolves.toBe(true);
  });

  it('denies another gallery', async () => {
    exhibitionRepository.findOneBy.mockResolvedValue({ id: 1, galleryId: 99 });

    await expect(
      guard.canActivate(contextFor({ userId: 10, role: UserRole.GALLERY })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('lets an admin through without ownership', async () => {
    await expect(
      guard.canActivate(contextFor({ userId: 1, role: UserRole.ADMIN })),
    ).resolves.toBe(true);
    expect(exhibitionRepository.findOneBy).not.toHaveBeenCalled();
  });

  it('denies when no user is attached to the request', async () => {
    await expect(guard.canActivate(contextFor(undefined))).resolves.toBe(false);
  });
});
