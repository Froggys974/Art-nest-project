import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, LessThanOrEqual, Repository } from 'typeorm';
import { Artist } from 'src/artists/artist.entity';
import { BusinessRuleViolationException } from 'src/common/exceptions/business-rule-violation.exception';
import { Artwork } from './artwork.entity';
import { ArtworkStatus } from './artwork-status.enum';
import { ArtworkStatusHistory } from './artwork-status-history.entity';
import { CreateArtworkDto } from './dto/create-artwork.dto';
import { UpdateArtworkDto } from './dto/update-artwork.dto';

/**
 * Returns the current date in YYYY-MM-DD format.
 * @returns The current date as an ISO date string
 */
const today = (): string => new Date().toISOString().slice(0, 10);

@Injectable()
export class ArtworksService {
  constructor(
    @InjectRepository(Artwork)
    private readonly artworkRepository: Repository<Artwork>,
    @InjectRepository(ArtworkStatusHistory)
    private readonly historyRepository: Repository<ArtworkStatusHistory>,
    @InjectRepository(Artist)
    private readonly artistRepository: Repository<Artist>,
  ) {}

  /**
   * Creates a new artwork for a gallery and records the initial status.
   * @param dto - The artwork creation data
   * @param galleryId - The ID of the gallery creating the artwork
   * @returns The created artwork entity
   * @throws {NotFoundException} If artist not found
   * @throws {BusinessRuleViolationException} If artist belongs to another gallery
   */
  async create(dto: CreateArtworkDto, galleryId: number): Promise<Artwork> {
    const artist = await this.artistRepository.findOneBy({ id: dto.artistId });
    if (!artist) {
      throw new NotFoundException('Artist not found');
    }
    if (artist.galleryId !== galleryId) {
      throw new BusinessRuleViolationException(
        'Artist belongs to another gallery',
        'ARTIST_NOT_IN_GALLERY',
      );
    }

    const artwork = await this.artworkRepository.save(
      this.artworkRepository.create({
        ...dto,
        depositDate: dto.depositDate ?? today(),
        galleryId,
      }),
    );
    await this.recordStatusChange(artwork.id, null, artwork.status, galleryId);
    return artwork;
  }

  /**
   * Retrieves all artworks with optional filters.
   * @param status - Optional filter by artwork status
   * @param maxPrice - Optional filter by maximum price
   * @param artistId - Optional filter by artist ID
   * @returns Array of artwork entities matching the filters
   */
  async findAll(
    status?: ArtworkStatus,
    maxPrice?: number,
    artistId?: number,
  ): Promise<Artwork[]> {
    const where: FindOptionsWhere<Artwork> = {};
    if (status) {
      where.status = status;
    }
    if (maxPrice !== undefined) {
      where.price = LessThanOrEqual(maxPrice);
    }
    if (artistId !== undefined) {
      where.artistId = artistId;
    }
    return this.artworkRepository.findBy(where);
  }

  /**
   * Retrieves artworks for a specific artist user with optional filters.
   * @param userId - The user ID of the artist
   * @param status - Optional filter by artwork status
   * @param maxPrice - Optional filter by maximum price
   * @returns Array of artwork entities
   * @throws {NotFoundException} If no artist profile is linked to this account
   */
  async findMine(
    userId: number,
    status?: ArtworkStatus,
    maxPrice?: number,
  ): Promise<Artwork[]> {
    const artist = await this.artistRepository.findOneBy({ userId });
    if (!artist) {
      throw new NotFoundException('No artist profile linked to this account');
    }
    return this.findAll(status, maxPrice, artist.id);
  }

  /**
   * Retrieves a single artwork by ID.
   * @param id - The artwork ID
   * @returns The artwork entity
   * @throws {NotFoundException} If artwork not found
   */
  async findOne(id: number): Promise<Artwork> {
    const artwork = await this.artworkRepository.findOneBy({ id });
    if (!artwork) {
      throw new NotFoundException('Artwork not found');
    }
    return artwork;
  }

  /**
   * Updates an artwork's information.
   * @param id - The artwork ID
   * @param dto - The update data
   * @returns The updated artwork entity
   */
  async update(id: number, dto: UpdateArtworkDto): Promise<Artwork> {
    const artwork = await this.findOne(id);
    Object.assign(artwork, dto);
    return this.artworkRepository.save(artwork);
  }

  /**
   * Changes the status of an artwork and records the change in history.
   * @param id - The artwork ID
   * @param status - The new status
   * @param changedById - The ID of the user making the change
   * @returns The updated artwork entity
   * @throws {BusinessRuleViolationException} If trying to set status to SOLD or change a sold artwork
   */
  async changeStatus(
    id: number,
    status: ArtworkStatus,
    changedById: number,
  ): Promise<Artwork> {
    const artwork = await this.findOne(id);
    if (status === artwork.status) {
      return artwork;
    }
    if (status === ArtworkStatus.SOLD) {
      throw new BusinessRuleViolationException(
        'An artwork can only be sold through a sale',
        'ARTWORK_SOLD_ONLY_VIA_SALE',
      );
    }
    if (artwork.status === ArtworkStatus.SOLD) {
      throw new BusinessRuleViolationException(
        'A sold artwork cannot change status',
        'ARTWORK_ALREADY_SOLD',
      );
    }

    const previousStatus = artwork.status;
    artwork.status = status;
    await this.artworkRepository.save(artwork);
    await this.recordStatusChange(id, previousStatus, status, changedById);
    return artwork;
  }

  /**
   * Retrieves the status change history for an artwork.
   * @param id - The artwork ID
   * @returns Array of status history entries in chronological order
   */
  async history(id: number): Promise<ArtworkStatusHistory[]> {
    await this.findOne(id);
    return this.historyRepository.find({
      where: { artworkId: id },
      order: { changedAt: 'ASC' },
    });
  }

  /**
   * Records a status change in the artwork history.
   * @param artworkId - The artwork ID
   * @param previousStatus - The previous status (null for initial creation)
   * @param newStatus - The new status
   * @param changedById - The ID of the user who made the change
   */
  private async recordStatusChange(
    artworkId: number,
    previousStatus: ArtworkStatus | null,
    newStatus: ArtworkStatus,
    changedById: number,
  ): Promise<void> {
    await this.historyRepository.save(
      this.historyRepository.create({
        artworkId,
        previousStatus,
        newStatus,
        changedById,
      }),
    );
  }
}
