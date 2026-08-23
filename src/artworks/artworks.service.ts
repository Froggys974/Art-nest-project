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

  async findAll(status?: ArtworkStatus, maxPrice?: number): Promise<Artwork[]> {
    const where: FindOptionsWhere<Artwork> = {};
    if (status) {
      where.status = status;
    }
    if (maxPrice !== undefined) {
      where.price = LessThanOrEqual(maxPrice);
    }
    return this.artworkRepository.findBy(where);
  }

  async findOne(id: number): Promise<Artwork> {
    const artwork = await this.artworkRepository.findOneBy({ id });
    if (!artwork) {
      throw new NotFoundException('Artwork not found');
    }
    return artwork;
  }

  async update(id: number, dto: UpdateArtworkDto): Promise<Artwork> {
    const artwork = await this.findOne(id);
    Object.assign(artwork, dto);
    return this.artworkRepository.save(artwork);
  }

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

  async history(id: number): Promise<ArtworkStatusHistory[]> {
    await this.findOne(id);
    return this.historyRepository.find({
      where: { artworkId: id },
      order: { changedAt: 'ASC' },
    });
  }

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
