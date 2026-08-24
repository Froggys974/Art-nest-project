import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { ArtworksService } from '../artworks/artworks.service';
import { Artwork } from '../artworks/artwork.entity';
import { ArtworkStatus } from '../artworks/artwork-status.enum';
import { ArtworkStatusHistory } from '../artworks/artwork-status-history.entity';
import { BusinessRuleViolationException } from '../common/exceptions/business-rule-violation.exception';
import { Exhibition } from './exhibition.entity';
import { ExhibitionsService } from './exhibitions.service';

describe('ExhibitionsService', () => {
  let service: ExhibitionsService;
  let exhibitionRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
  };
  let artworkRepository: { findBy: jest.Mock; save: jest.Mock };
  let historyRepository: { create: jest.Mock; save: jest.Mock };
  let artworksService: { changeStatus: jest.Mock };
  let dataSource: { transaction: jest.Mock };

  const dto = {
    name: 'Spring Show',
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    locationOrUrl: 'Main Gallery',
    artworkIds: [1, 2],
  };

  beforeEach(async () => {
    exhibitionRepository = {
      create: jest.fn((value: Partial<Exhibition>) => value),
      save: jest.fn((value: Partial<Exhibition>) => Promise.resolve(value)),
      find: jest.fn(),
      findOne: jest.fn(),
    };
    artworkRepository = {
      findBy: jest.fn(),
      save: jest.fn((value: Partial<Artwork>) => Promise.resolve(value)),
    };
    historyRepository = {
      create: jest.fn((value: Partial<ArtworkStatusHistory>) => value),
      save: jest.fn((value: Partial<ArtworkStatusHistory>) =>
        Promise.resolve(value),
      ),
    };
    artworksService = { changeStatus: jest.fn() };

    const manager = {
      getRepository: jest.fn((entity: unknown) => {
        if (entity === Exhibition) return exhibitionRepository;
        if (entity === Artwork) return artworkRepository;
        if (entity === ArtworkStatusHistory) return historyRepository;
        throw new Error('Unexpected repository requested');
      }),
    };
    dataSource = {
      transaction: jest.fn((cb: (manager: unknown) => unknown) => cb(manager)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExhibitionsService,
        {
          provide: getRepositoryToken(Exhibition),
          useValue: exhibitionRepository,
        },
        { provide: getRepositoryToken(Artwork), useValue: artworkRepository },
        { provide: ArtworksService, useValue: artworksService },
        { provide: getDataSourceToken(), useValue: dataSource },
      ],
    }).compile();

    service = module.get<ExhibitionsService>(ExhibitionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates an exhibition, puts its artworks on loan, and historizes it', async () => {
    artworkRepository.findBy.mockResolvedValue([
      { id: 1, galleryId: 10, status: ArtworkStatus.AVAILABLE },
      { id: 2, galleryId: 10, status: ArtworkStatus.AVAILABLE },
    ]);

    const exhibition = await service.create(dto, 10);

    expect(exhibition.galleryId).toBe(10);
    expect(dataSource.transaction).toHaveBeenCalled();
    expect(artworkRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, status: ArtworkStatus.ON_LOAN }),
    );
    expect(artworkRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 2, status: ArtworkStatus.ON_LOAN }),
    );
    expect(historyRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        artworkId: 1,
        previousStatus: ArtworkStatus.AVAILABLE,
        newStatus: ArtworkStatus.ON_LOAN,
        changedById: 10,
      }),
    );
  });

  it('rejects creating an exhibition with no artworks', async () => {
    await expect(
      service.create({ ...dto, artworkIds: [] }, 10),
    ).rejects.toThrow(BusinessRuleViolationException);
  });

  it('rejects an exhibition ending before it starts', async () => {
    await expect(
      service.create(
        { ...dto, startDate: '2026-03-31', endDate: '2026-03-01' },
        10,
      ),
    ).rejects.toThrow(BusinessRuleViolationException);
  });

  it('rejects an exhibition referencing a missing artwork', async () => {
    artworkRepository.findBy.mockResolvedValue([
      { id: 1, galleryId: 10, status: ArtworkStatus.AVAILABLE },
    ]);

    await expect(service.create(dto, 10)).rejects.toThrow(NotFoundException);
  });

  it('rejects an exhibition with an artwork from another gallery', async () => {
    artworkRepository.findBy.mockResolvedValue([
      { id: 1, galleryId: 10, status: ArtworkStatus.AVAILABLE },
      { id: 2, galleryId: 99, status: ArtworkStatus.AVAILABLE },
    ]);

    await expect(service.create(dto, 10)).rejects.toThrow(
      BusinessRuleViolationException,
    );
  });

  it('rejects an exhibition with an artwork already on loan', async () => {
    artworkRepository.findBy.mockResolvedValue([
      { id: 1, galleryId: 10, status: ArtworkStatus.ON_LOAN },
      { id: 2, galleryId: 10, status: ArtworkStatus.AVAILABLE },
    ]);

    await expect(service.create(dto, 10)).rejects.toThrow(
      BusinessRuleViolationException,
    );
  });

  it('returns loaned artworks to available when the exhibition ends', async () => {
    exhibitionRepository.findOne.mockResolvedValue({
      id: 1,
      galleryId: 10,
      artworks: [
        { id: 1, status: ArtworkStatus.ON_LOAN },
        { id: 2, status: ArtworkStatus.SOLD },
      ],
    });

    await service.end(1, 10);

    expect(artworksService.changeStatus).toHaveBeenCalledWith(
      1,
      ArtworkStatus.AVAILABLE,
      10,
    );
    expect(artworksService.changeStatus).not.toHaveBeenCalledWith(
      2,
      ArtworkStatus.AVAILABLE,
      10,
    );
  });

  it('throws when ending an exhibition that does not exist', async () => {
    exhibitionRepository.findOne.mockResolvedValue(null);

    await expect(service.end(1, 10)).rejects.toThrow(NotFoundException);
  });
});
