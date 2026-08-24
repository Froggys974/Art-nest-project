import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Artist } from '../artists/artist.entity';
import { BusinessRuleViolationException } from '../common/exceptions/business-rule-violation.exception';
import { Artwork } from './artwork.entity';
import { ArtworkStatus } from './artwork-status.enum';
import { ArtworkStatusHistory } from './artwork-status-history.entity';
import { ArtworksService } from './artworks.service';

describe('ArtworksService', () => {
  let service: ArtworksService;
  let artworkRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findBy: jest.Mock;
    findOneBy: jest.Mock;
  };
  let historyRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
  };
  let artistRepository: { findOneBy: jest.Mock };

  beforeEach(async () => {
    artworkRepository = {
      create: jest.fn((value: Partial<Artwork>) => value),
      save: jest.fn((value: Partial<Artwork>) => Promise.resolve(value)),
      findBy: jest.fn(),
      findOneBy: jest.fn(),
    };
    historyRepository = {
      create: jest.fn((value: Partial<ArtworkStatusHistory>) => value),
      save: jest.fn(),
      find: jest.fn(),
    };
    artistRepository = { findOneBy: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArtworksService,
        { provide: getRepositoryToken(Artwork), useValue: artworkRepository },
        {
          provide: getRepositoryToken(ArtworkStatusHistory),
          useValue: historyRepository,
        },
        { provide: getRepositoryToken(Artist), useValue: artistRepository },
      ],
    }).compile();

    service = module.get<ArtworksService>(ArtworksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('refuses an artwork for an artist of another gallery', async () => {
    artistRepository.findOneBy.mockResolvedValue({ id: 1, galleryId: 99 });

    await expect(
      service.create(
        { artistId: 1 } as Parameters<typeof service.create>[0],
        10,
      ),
    ).rejects.toThrow(BusinessRuleViolationException);
  });

  it('records a history entry on status change', async () => {
    artworkRepository.findOneBy.mockResolvedValue({
      id: 1,
      status: ArtworkStatus.AVAILABLE,
    });

    await service.changeStatus(1, ArtworkStatus.ON_LOAN, 10);

    expect(historyRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        artworkId: 1,
        previousStatus: ArtworkStatus.AVAILABLE,
        newStatus: ArtworkStatus.ON_LOAN,
        changedById: 10,
      }),
    );
  });

  it('refuses to mark an artwork sold outside of a sale', async () => {
    artworkRepository.findOneBy.mockResolvedValue({
      id: 1,
      status: ArtworkStatus.AVAILABLE,
    });

    await expect(
      service.changeStatus(1, ArtworkStatus.SOLD, 10),
    ).rejects.toThrow(BusinessRuleViolationException);
  });

  it('refuses to change the status of a sold artwork', async () => {
    artworkRepository.findOneBy.mockResolvedValue({
      id: 1,
      status: ArtworkStatus.SOLD,
    });

    await expect(
      service.changeStatus(1, ArtworkStatus.AVAILABLE, 10),
    ).rejects.toThrow(BusinessRuleViolationException);
  });

  it("resolves the caller's own artworks via their linked artist profile", async () => {
    artistRepository.findOneBy.mockResolvedValue({ id: 7, userId: 30 });
    artworkRepository.findBy.mockResolvedValue([{ id: 1, artistId: 7 }]);

    const artworks = await service.findMine(30);

    expect(artistRepository.findOneBy).toHaveBeenCalledWith({ userId: 30 });
    expect(artworkRepository.findBy).toHaveBeenCalledWith({ artistId: 7 });
    expect(artworks).toEqual([{ id: 1, artistId: 7 }]);
  });

  it('refuses findMine when the account has no linked artist profile', async () => {
    artistRepository.findOneBy.mockResolvedValue(null);

    await expect(service.findMine(30)).rejects.toThrow(NotFoundException);
  });
});
