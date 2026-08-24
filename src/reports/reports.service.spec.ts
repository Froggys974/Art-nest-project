import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Artist } from '../artists/artist.entity';
import { Artwork } from '../artworks/artwork.entity';
import { Sale } from '../sales/sale.entity';
import { UserRole } from '../user/user-role.enum';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let saleRepository: { find: jest.Mock; findBy: jest.Mock };
  let artworkRepository: { findBy: jest.Mock };
  let artistRepository: { findOneBy: jest.Mock };

  beforeEach(async () => {
    saleRepository = { find: jest.fn(), findBy: jest.fn() };
    artworkRepository = { findBy: jest.fn() };
    artistRepository = { findOneBy: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(Sale), useValue: saleRepository },
        { provide: getRepositoryToken(Artwork), useValue: artworkRepository },
        { provide: getRepositoryToken(Artist), useValue: artistRepository },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('adminSummary', () => {
    it('aggregates revenue, commission and artist balance across all sales', async () => {
      saleRepository.find.mockResolvedValue([
        { salePrice: 5000, galleryCommission: 2000, artistBalance: 3000 },
        { salePrice: 1000, galleryCommission: 400, artistBalance: 600 },
      ]);

      const summary = await service.adminSummary();

      expect(summary).toEqual({
        totalSales: 2,
        totalRevenue: 6000,
        totalCommission: 2400,
        totalArtistBalance: 3600,
      });
    });

    it('returns zeroed totals when there are no sales', async () => {
      saleRepository.find.mockResolvedValue([]);

      const summary = await service.adminSummary();

      expect(summary).toEqual({
        totalSales: 0,
        totalRevenue: 0,
        totalCommission: 0,
        totalArtistBalance: 0,
      });
    });
  });

  describe('gallerySales', () => {
    it('aggregates only sales for artworks owned by the gallery', async () => {
      artworkRepository.findBy.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      saleRepository.findBy.mockResolvedValue([
        { salePrice: 2000, galleryCommission: 800, artistBalance: 1200 },
      ]);

      const summary = await service.gallerySales(10);

      expect(artworkRepository.findBy).toHaveBeenCalledWith({ galleryId: 10 });
      expect(summary).toEqual({
        totalSales: 1,
        totalRevenue: 2000,
        totalCommission: 800,
      });
    });

    it('skips the sales lookup when the gallery has no artworks', async () => {
      artworkRepository.findBy.mockResolvedValue([]);

      const summary = await service.gallerySales(10);

      expect(saleRepository.findBy).not.toHaveBeenCalled();
      expect(summary).toEqual({
        totalSales: 0,
        totalRevenue: 0,
        totalCommission: 0,
      });
    });
  });

  describe('artistRevenue', () => {
    it('lets the owning gallery view the artist revenue', async () => {
      artistRepository.findOneBy.mockResolvedValue({ id: 1, galleryId: 10 });
      artworkRepository.findBy.mockResolvedValue([{ id: 5 }]);
      saleRepository.findBy.mockResolvedValue([
        { salePrice: 3000, galleryCommission: 1200, artistBalance: 1800 },
      ]);

      const summary = await service.artistRevenue(1, {
        userId: 10,
        role: UserRole.GALLERY,
      });

      expect(summary).toEqual({ totalSales: 1, totalRevenue: 1800 });
    });

    it('lets an admin view any artist revenue', async () => {
      artistRepository.findOneBy.mockResolvedValue({ id: 1, galleryId: 99 });
      artworkRepository.findBy.mockResolvedValue([]);

      const summary = await service.artistRevenue(1, {
        userId: 1,
        role: UserRole.ADMIN,
      });

      expect(summary).toEqual({ totalSales: 0, totalRevenue: 0 });
    });

    it('denies a gallery viewing another gallery artist', async () => {
      artistRepository.findOneBy.mockResolvedValue({ id: 1, galleryId: 99 });

      await expect(
        service.artistRevenue(1, { userId: 10, role: UserRole.GALLERY }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws when the artist does not exist', async () => {
      artistRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.artistRevenue(1, { userId: 1, role: UserRole.ADMIN }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
