import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from '../user/user.service';
import { UserRole } from '../user/user-role.enum';
import { Artwork } from '../artworks/artwork.entity';
import { Artist } from './artist.entity';
import { ArtistsService } from './artists.service';

describe('ArtistsService', () => {
  let service: ArtistsService;
  let artistRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findBy: jest.Mock;
    findOneBy: jest.Mock;
  };
  let artworkRepository: { createQueryBuilder: jest.Mock };
  let queryBuilder: {
    update: jest.Mock;
    set: jest.Mock;
    where: jest.Mock;
    execute: jest.Mock;
  };
  let userService: { findOneBy: jest.Mock };
  let dataSource: { transaction: jest.Mock };

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
      findBy: jest.fn(),
      findOneBy: jest.fn(),
    };
    queryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined),
    };
    artworkRepository = {
      createQueryBuilder: jest.fn(() => queryBuilder),
    };
    userService = { findOneBy: jest.fn() };
    const manager = {
      createQueryBuilder: jest.fn(() => queryBuilder),
      getRepository: jest.fn(() => artistRepository),
    };
    dataSource = {
      transaction: jest.fn((cb: (manager: unknown) => unknown) => cb(manager)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArtistsService,
        { provide: getRepositoryToken(Artist), useValue: artistRepository },
        { provide: getRepositoryToken(Artwork), useValue: artworkRepository },
        { provide: UserService, useValue: userService },
        { provide: getDataSourceToken(), useValue: dataSource },
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

  it('transfers an artist, resets the entry date, and moves non-sold artworks', async () => {
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
    expect(dataSource.transaction).toHaveBeenCalled();
    expect(queryBuilder.set).toHaveBeenCalledWith({ galleryId: 20 });
    expect(queryBuilder.where).toHaveBeenCalledWith(
      'artistId = :id AND status != :sold',
      { id: 1, sold: 'sold' },
    );
  });

  it('propagates a failed artist save after the artwork move ran in the same transaction', async () => {
    artistRepository.findOneBy.mockResolvedValue({
      id: 1,
      galleryId: 10,
      entryDate: '2020-01-01',
    });
    userService.findOneBy.mockResolvedValue({
      userId: 20,
      role: UserRole.GALLERY,
    });
    artistRepository.save.mockRejectedValueOnce(new Error('db write failed'));

    await expect(service.transfer(1, 20)).rejects.toThrow('db write failed');
    expect(queryBuilder.execute).toHaveBeenCalled();
    expect(artistRepository.save).toHaveBeenCalled();
  });

  it('scopes findAll to the caller gallery, admin sees everything', async () => {
    artistRepository.findBy.mockResolvedValue([{ id: 1, galleryId: 10 }]);
    await service.findAll(gallery);
    expect(artistRepository.findBy).toHaveBeenCalledWith({ galleryId: 10 });

    artistRepository.find.mockResolvedValue([{ id: 1, galleryId: 10 }]);
    await service.findAll({ ...gallery, role: UserRole.ADMIN });
    expect(artistRepository.find).toHaveBeenCalled();
  });

  it('refuses findOne for an artist in another gallery', async () => {
    artistRepository.findOneBy.mockResolvedValue({ id: 1, galleryId: 99 });

    await expect(service.findOne(1, gallery)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('links an artist account to an artist profile', async () => {
    artistRepository.findOneBy
      .mockResolvedValueOnce({ id: 1, galleryId: 10 })
      .mockResolvedValueOnce(null);
    userService.findOneBy.mockResolvedValue({
      userId: 30,
      role: UserRole.ARTIST,
    });

    const artist = await service.linkUser(1, { userId: 30 }, gallery);

    expect(artist.userId).toBe(30);
  });

  it('refuses linking a non-artist account', async () => {
    artistRepository.findOneBy.mockResolvedValueOnce({ id: 1, galleryId: 10 });
    userService.findOneBy.mockResolvedValue({
      userId: 30,
      role: UserRole.COLLECTOR,
    });

    await expect(service.linkUser(1, { userId: 30 }, gallery)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('refuses linking an account already linked to another artist', async () => {
    artistRepository.findOneBy
      .mockResolvedValueOnce({ id: 1, galleryId: 10 })
      .mockResolvedValueOnce({ id: 2, userId: 30 });
    userService.findOneBy.mockResolvedValue({
      userId: 30,
      role: UserRole.ARTIST,
    });

    await expect(service.linkUser(1, { userId: 30 }, gallery)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('resolves an artist profile by its linked user id', async () => {
    artistRepository.findOneBy.mockResolvedValue({ id: 1, userId: 30 });

    const artist = await service.findByUserId(30);

    expect(artist.id).toBe(1);
  });
});
