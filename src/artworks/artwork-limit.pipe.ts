import { Injectable, PipeTransform } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BusinessRuleViolationException } from 'src/common/exceptions/business-rule-violation.exception';
import { Artwork } from './artwork.entity';
import { ArtworkStatus } from './artwork-status.enum';
import { CreateArtworkDto } from './dto/create-artwork.dto';

/**
 * Maximum number of active (available or on loan) artworks an artist can have.
 */
export const MAX_ACTIVE_ARTWORKS_PER_ARTIST = 50;

@Injectable()
export class ArtworkLimitPipe implements PipeTransform<CreateArtworkDto> {
  constructor(
    @InjectRepository(Artwork)
    private readonly artworkRepository: Repository<Artwork>,
  ) {}

  /**
   * Validates that an artist hasn't exceeded the maximum number of active artworks.
   * @param dto - The artwork creation DTO to validate
   * @returns The validated DTO
   * @throws {BusinessRuleViolationException} If artist has reached the limit of 50 active artworks
   */
  async transform(dto: CreateArtworkDto): Promise<CreateArtworkDto> {
    const activeCount = await this.artworkRepository.countBy({
      artistId: dto.artistId,
      status: In([ArtworkStatus.AVAILABLE, ArtworkStatus.ON_LOAN]),
    });
    if (activeCount >= MAX_ACTIVE_ARTWORKS_PER_ARTIST) {
      throw new BusinessRuleViolationException(
        `An artist cannot have more than ${MAX_ACTIVE_ARTWORKS_PER_ARTIST} active artworks`,
        'ARTIST_ARTWORK_LIMIT_REACHED',
      );
    }
    return dto;
  }
}
