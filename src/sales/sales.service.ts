import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryFailedError } from 'typeorm';
import { Artwork } from 'src/artworks/artwork.entity';
import { ArtworkStatus } from 'src/artworks/artwork-status.enum';
import { ArtworkStatusHistory } from 'src/artworks/artwork-status-history.entity';
import { BusinessRuleViolationException } from 'src/common/exceptions/business-rule-violation.exception';
import { round2 } from 'src/common/money';
import { Sale } from './sale.entity';
import { CreateSaleDto } from './dto/create-sale.dto';

const commissionRateFor = (salePrice: number): number => {
  if (salePrice <= 5000) return 0.4;
  if (salePrice <= 20000) return 0.35;
  return 0.3;
};

@Injectable()
export class SalesService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async create(dto: CreateSaleDto, collectorId: number): Promise<Sale> {
    try {
      return await this.runSaleTransaction(dto, collectorId);
    } catch (error) {
      // Concurrent sale of the same artwork: the losing transaction hits the
      // unique constraint on Sale.artworkId. Surface it as a clean business
      // rule violation instead of an opaque 500.
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string })?.code === '23505'
      ) {
        throw new BusinessRuleViolationException(
          'Artwork already sold',
          'ARTWORK_ALREADY_SOLD',
        );
      }
      throw error;
    }
  }

  private async runSaleTransaction(
    dto: CreateSaleDto,
    collectorId: number,
  ): Promise<Sale> {
    return this.dataSource.transaction(async (manager) => {
      const artworkRepository = manager.getRepository(Artwork);
      const saleRepository = manager.getRepository(Sale);
      const historyRepository = manager.getRepository(ArtworkStatusHistory);
      const artwork = await artworkRepository.findOne({
        where: { id: dto.artworkId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!artwork) {
        throw new NotFoundException('Artwork not found');
      }
      if (artwork.status === ArtworkStatus.ON_LOAN) {
        throw new BusinessRuleViolationException(
          'An artwork on loan cannot be sold',
          'ARTWORK_ON_LOAN',
        );
      }
      if (artwork.status === ArtworkStatus.SOLD) {
        throw new BusinessRuleViolationException(
          'Artwork already sold',
          'ARTWORK_ALREADY_SOLD',
        );
      }
      if (dto.salePrice < artwork.reservePrice) {
        throw new BusinessRuleViolationException(
          'Sale price is below the reserve price',
          'BELOW_RESERVE_PRICE',
        );
      }

      const galleryCommission = round2(
        dto.salePrice * commissionRateFor(dto.salePrice),
      );
      const artistBalance = round2(dto.salePrice - galleryCommission);

      const sale = await saleRepository.save(
        saleRepository.create({
          salePrice: dto.salePrice,
          galleryCommission,
          artistBalance,
          collectorId,
          artworkId: artwork.id,
        }),
      );

      const previousStatus = artwork.status;
      artwork.status = ArtworkStatus.SOLD;
      await artworkRepository.save(artwork);
      await historyRepository.save(
        historyRepository.create({
          artworkId: artwork.id,
          previousStatus,
          newStatus: ArtworkStatus.SOLD,
          changedById: collectorId,
        }),
      );

      return sale;
    });
  }
}
