import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRole } from '../user/user-role.enum';
import { Artwork } from './artwork.entity';
import { OwnershipGuard } from './ownership.guard';

describe('OwnershipGuard', () => {
  let guard: OwnershipGuard;
  let artworkRepository: { findOneBy: jest.Mock };

  const contextFor = (
    user: { userId: number; role: UserRole } | undefined,
    id = '1',
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user, params: { id } }) }),
    }) as unknown as ExecutionContext;

  beforeEach(async () => {
    artworkRepository = { findOneBy: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OwnershipGuard,
        { provide: getRepositoryToken(Artwork), useValue: artworkRepository },
      ],
    }).compile();

    guard = module.get<OwnershipGuard>(OwnershipGuard);
  });

  it('allows the gallery owning the artwork', async () => {
    artworkRepository.findOneBy.mockResolvedValue({ id: 1, galleryId: 10 });

    await expect(
      guard.canActivate(contextFor({ userId: 10, role: UserRole.GALLERY })),
    ).resolves.toBe(true);
  });

  it('denies another gallery', async () => {
    artworkRepository.findOneBy.mockResolvedValue({ id: 1, galleryId: 99 });

    await expect(
      guard.canActivate(contextFor({ userId: 10, role: UserRole.GALLERY })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('lets an admin through without ownership', async () => {
    await expect(
      guard.canActivate(contextFor({ userId: 1, role: UserRole.ADMIN })),
    ).resolves.toBe(true);
    expect(artworkRepository.findOneBy).not.toHaveBeenCalled();
  });

  it('denies when no user is attached to the request', async () => {
    await expect(guard.canActivate(contextFor(undefined))).resolves.toBe(false);
  });
});
