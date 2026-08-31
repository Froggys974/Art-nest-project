import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Artwork } from 'src/artworks/artwork.entity';
import { ArtworkStatus } from 'src/artworks/artwork-status.enum';
import { ArtworkStatusHistory } from 'src/artworks/artwork-status-history.entity';
import { ArtworksService } from 'src/artworks/artworks.service';
import { BusinessRuleViolationException } from 'src/common/exceptions/business-rule-violation.exception';
import { Exhibition } from './exhibition.entity';
import { CreateExhibitionDto } from './dto/create-exhibition.dto';

@Injectable()
export class ExhibitionsService {
  constructor(
    @InjectRepository(Exhibition)
    private readonly exhibitionRepository: Repository<Exhibition>,
    @InjectRepository(Artwork)
    private readonly artworkRepository: Repository<Artwork>,
    private readonly artworksService: ArtworksService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /**
   * Creates an exhibition and sets all listed artworks to ON_LOAN status.
   * @param dto - The exhibition creation data
   * @param galleryId - The ID of the gallery creating the exhibition
   * @returns The created exhibition entity with artworks
   * @throws {BusinessRuleViolationException} If no artworks, invalid date range, artwork not owned, or already on loan
   * @throws {NotFoundException} If one or more artworks not found
   */
  async create(
    dto: CreateExhibitionDto,
    galleryId: number,
  ): Promise<Exhibition> {
    if (dto.artworkIds.length === 0) {
      throw new BusinessRuleViolationException(
        'An exhibition requires at least one artwork',
        'EXHIBITION_REQUIRES_ARTWORK',
      );
    }
    if (dto.endDate < dto.startDate) {
      throw new BusinessRuleViolationException(
        'Exhibition end date cannot be before its start date',
        'EXHIBITION_INVALID_DATE_RANGE',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const exhibitionRepository = manager.getRepository(Exhibition);
      const artworkRepository = manager.getRepository(Artwork);
      const historyRepository = manager.getRepository(ArtworkStatusHistory);
      const artworks = await artworkRepository.find({
        where: { id: In(dto.artworkIds) },
        order: { id: 'ASC' },
        lock: { mode: 'pessimistic_write' },
      });
      if (artworks.length !== dto.artworkIds.length) {
        throw new NotFoundException('One or more artworks not found');
      }
      if (artworks.some((artwork) => artwork.galleryId !== galleryId)) {
        throw new BusinessRuleViolationException(
          'Artwork belongs to another gallery',
          'ARTWORK_NOT_IN_GALLERY',
        );
      }
      if (
        artworks.some((artwork) => artwork.status === ArtworkStatus.ON_LOAN)
      ) {
        throw new BusinessRuleViolationException(
          'Artwork is already on loan',
          'ARTWORK_ALREADY_ON_LOAN',
        );
      }

      const exhibition = await exhibitionRepository.save(
        exhibitionRepository.create({ ...dto, galleryId, artworks }),
      );

      for (const artwork of artworks) {
        const previousStatus = artwork.status;
        artwork.status = ArtworkStatus.ON_LOAN;
        await artworkRepository.save(artwork);
        await historyRepository.save(
          historyRepository.create({
            artworkId: artwork.id,
            previousStatus,
            newStatus: ArtworkStatus.ON_LOAN,
            changedById: galleryId,
          }),
        );
      }

      return exhibition;
    });
  }

  /**
   * Retrieves all exhibitions with their associated artworks.
   * @returns Array of exhibition entities with artwork relations
   */
  async findAll(): Promise<Exhibition[]> {
    return this.exhibitionRepository.find({ relations: { artworks: true } });
  }

  /**
   * Retrieves a single exhibition by ID with its artworks.
   * @param id - The exhibition ID
   * @returns The exhibition entity with artwork relations
   * @throws {NotFoundException} If exhibition not found
   */
  async findOne(id: number): Promise<Exhibition> {
    const exhibition = await this.exhibitionRepository.findOne({
      where: { id },
      relations: { artworks: true },
    });
    if (!exhibition) {
      throw new NotFoundException('Exhibition not found');
    }
    return exhibition;
  }

  /**
   * Ends an exhibition and returns all loaned artworks to AVAILABLE status.
   * @param id - The exhibition ID
   * @param userId - The ID of the user ending the exhibition
   * @returns The exhibition entity
   */
  async end(id: number, userId: number): Promise<Exhibition> {
    const exhibition = await this.findOne(id);
    for (const artwork of exhibition.artworks) {
      if (artwork.status === ArtworkStatus.ON_LOAN) {
        await this.artworksService.changeStatus(
          artwork.id,
          ArtworkStatus.AVAILABLE,
          userId,
        );
      }
    }
    return exhibition;
  }
}
