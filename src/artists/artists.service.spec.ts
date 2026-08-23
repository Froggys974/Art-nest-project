import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from '../user/user.service';
import { UserRole } from '../user/user-role.enum';
import { Artist } from './artist.entity';
import { ArtistsService } from './artists.service';

describe('ArtistsService', () => {
  let service: ArtistsService;
  let artistRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOneBy: jest.Mock;
  };
  let userService: { findOneBy: jest.Mock };

  const gallery = {
    userId: 10,
    username: 'gallery',
    role: UserRole.GALLERY,
    isValidated: true,
  };

  beforeEach(async () => {
    artistRepository = {
      create: jest.fn((value: Partial<Artist>) => value),
      save: jest.fn((value: Partial<Artist>) => Promise.resolve(value)),
      find: jest.fn(),
      findOneBy: jest.fn(),
    };
    userService = { findOneBy: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArtistsService,
        { provide: getRepositoryToken(Artist), useValue: artistRepository },
        { provide: UserService, useValue: userService },
      ],
    }).compile();

    service = module.get<ArtistsService>(ArtistsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates an artist for the gallery with a default entry date', async () => {
    const artist = await service.create(
      { firstName: 'Frida', lastName: 'Kahlo', nationality: 'Mexican' },
      10,
    );

    expect(artist.galleryId).toBe(10);
    expect(artist.entryDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('refuses an update from another gallery', async () => {
    artistRepository.findOneBy.mockResolvedValue({ id: 1, galleryId: 99 });

    await expect(
      service.update(1, { biography: 'new bio' }, gallery),
    ).rejects.toThrow(ForbiddenException);
  });

  it('lets an admin update any artist', async () => {
    artistRepository.findOneBy.mockResolvedValue({ id: 1, galleryId: 99 });

    const artist = await service.update(
      1,
      { biography: 'new bio' },
      { ...gallery, role: UserRole.ADMIN },
    );

    expect(artist.biography).toBe('new bio');
  });

  it('refuses a transfer to a user that is not a gallery', async () => {
    artistRepository.findOneBy.mockResolvedValue({ id: 1, galleryId: 10 });
    userService.findOneBy.mockResolvedValue({
      userId: 3,
      role: UserRole.COLLECTOR,
    });

    await expect(service.transfer(1, 3)).rejects.toThrow(BadRequestException);
  });

  it('transfers an artist and resets the entry date', async () => {
    artistRepository.findOneBy.mockResolvedValue({
      id: 1,
      galleryId: 10,
      entryDate: '2020-01-01',
    });
    userService.findOneBy.mockResolvedValue({
      userId: 20,
      role: UserRole.GALLERY,
    });

    const artist = await service.transfer(1, 20);

    expect(artist.galleryId).toBe(20);
    expect(artist.entryDate).not.toBe('2020-01-01');
  });
});
