import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Artwork } from '../artworks/artwork.entity';
import { ArtworkStatus } from '../artworks/artwork-status.enum';
import { ArtworkStatusHistory } from '../artworks/artwork-status-history.entity';
import { BusinessRuleViolationException } from '../common/exceptions/business-rule-violation.exception';
import { Sale } from './sale.entity';
import { SalesService } from './sales.service';

describe('SalesService', () => {
  let service: SalesService;
  let artworkRepository: { findOneBy: jest.Mock; save: jest.Mock };
  let saleRepository: { create: jest.Mock; save: jest.Mock };
  let historyRepository: { create: jest.Mock; save: jest.Mock };
  let dataSource: { transaction: jest.Mock };

  const artwork = (overrides: Partial<Artwork> = {}): Artwork =>
    ({
      id: 1,
      status: ArtworkStatus.AVAILABLE,
      reservePrice: 1000,
      ...overrides,
    }) as Artwork;

  beforeEach(async () => {
    artworkRepository = {
      findOneBy: jest.fn(),
      save: jest.fn((value: Partial<Artwork>) => Promise.resolve(value)),
    };
    saleRepository = {
      create: jest.fn((value: Partial<Sale>) => value),
      save: jest.fn((value: Partial<Sale>) =>
        Promise.resolve({ id: 1, ...value }),
      ),
    };
    historyRepository = {
      create: jest.fn((value: Partial<ArtworkStatusHistory>) => value),
      save: jest.fn(),
    };

    const manager = {
      getRepository: jest.fn((entity: unknown) => {
        if (entity === Artwork) return artworkRepository;
        if (entity === Sale) return saleRepository;
        if (entity === ArtworkStatusHistory) return historyRepository;
        throw new Error('unexpected entity requested from manager');
      }),
    };
    dataSource = {
      transaction: jest.fn((cb: (manager: unknown) => unknown) => cb(manager)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesService, { provide: DataSource, useValue: dataSource }],
    }).compile();

    service = module.get<SalesService>(SalesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects a sale for a missing artwork', async () => {
    artworkRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.create({ artworkId: 1, salePrice: 2000 }, 20),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects a sale below the reserve price', async () => {
    artworkRepository.findOneBy.mockResolvedValue(
      artwork({ reservePrice: 5000 }),
    );

    await expect(
      service.create({ artworkId: 1, salePrice: 4999 }, 20),
    ).rejects.toThrow(BusinessRuleViolationException);
  });

  it('rejects a sale while the artwork is on loan', async () => {
    artworkRepository.findOneBy.mockResolvedValue(
      artwork({ status: ArtworkStatus.ON_LOAN }),
    );

    await expect(
      service.create({ artworkId: 1, salePrice: 2000 }, 20),
    ).rejects.toThrow(BusinessRuleViolationException);
  });

  it('rejects a sale for an artwork already sold', async () => {
    artworkRepository.findOneBy.mockResolvedValue(
      artwork({ status: ArtworkStatus.SOLD }),
    );

    await expect(
      service.create({ artworkId: 1, salePrice: 2000 }, 20),
    ).rejects.toThrow(BusinessRuleViolationException);
  });

  it('applies the 40% commission tier at or below 5000', async () => {
    artworkRepository.findOneBy.mockResolvedValue(artwork());

    const sale = await service.create({ artworkId: 1, salePrice: 5000 }, 20);

    expect(sale.galleryCommission).toBe(2000);
    expect(sale.artistBalance).toBe(3000);
  });

  it('applies the 35% commission tier between 5000 and 20000', async () => {
    artworkRepository.findOneBy.mockResolvedValue(artwork({ reservePrice: 0 }));

    const sale = await service.create({ artworkId: 1, salePrice: 20000 }, 20);

    expect(sale.galleryCommission).toBe(7000);
    expect(sale.artistBalance).toBe(13000);
  });

  it('applies the 30% commission tier above 20000', async () => {
    artworkRepository.findOneBy.mockResolvedValue(artwork({ reservePrice: 0 }));

    const sale = await service.create({ artworkId: 1, salePrice: 20001 }, 20);

    expect(sale.galleryCommission).toBe(6000.3);
    expect(sale.artistBalance).toBe(14000.7);
  });

  it('marks the artwork sold and records the status history within the transaction', async () => {
    artworkRepository.findOneBy.mockResolvedValue(artwork());

    await service.create({ artworkId: 1, salePrice: 2000 }, 20);

    expect(artworkRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: ArtworkStatus.SOLD }),
    );
    expect(historyRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        artworkId: 1,
        previousStatus: ArtworkStatus.AVAILABLE,
        newStatus: ArtworkStatus.SOLD,
        changedById: 20,
      }),
    );
    expect(dataSource.transaction).toHaveBeenCalled();
  });

  it('stores the sale with the buying collector', async () => {
    artworkRepository.findOneBy.mockResolvedValue(artwork());

    const sale = await service.create({ artworkId: 1, salePrice: 2000 }, 20);

    expect(sale.collectorId).toBe(20);
    expect(sale.artworkId).toBe(1);
    expect(sale.salePrice).toBe(2000);
  });
});
