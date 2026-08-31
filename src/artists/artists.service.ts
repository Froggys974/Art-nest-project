import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserService } from 'src/user/user.service';
import { UserRole } from 'src/user/user-role.enum';
import { SafeUser } from 'src/user/types/safe-user.type';
import { Artwork } from 'src/artworks/artwork.entity';
import { ArtworkStatus } from 'src/artworks/artwork-status.enum';
import { Artist } from './artist.entity';
import { CreateArtistDto } from './dto/create-artist.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';
import { LinkArtistUserDto } from './dto/link-artist-user.dto';

/**
 * Returns the current date in YYYY-MM-DD format.
 * @returns The current date as an ISO date string
 */
const today = (): string => new Date().toISOString().slice(0, 10);

@Injectable()
export class ArtistsService {
  constructor(
    @InjectRepository(Artist)
    private readonly artistRepository: Repository<Artist>,
    @InjectRepository(Artwork)
    private readonly artworkRepository: Repository<Artwork>,
    private readonly userService: UserService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /**
   * Creates a new artist profile for a gallery.
   * @param dto - The artist creation data
   * @param galleryId - The ID of the gallery creating the artist
   * @returns The created artist entity
   */
  async create(dto: CreateArtistDto, galleryId: number): Promise<Artist> {
    const artist = this.artistRepository.create({
      ...dto,
      entryDate: dto.entryDate ?? today(),
      galleryId,
    });
    return this.artistRepository.save(artist);
  }

  /**
   * Retrieves all artists. Admin users see all artists, gallery users see only their own.
   * @param user - The authenticated user making the request
   * @returns Array of artist entities
   */
  async findAll(user: SafeUser): Promise<Artist[]> {
    if (user.role === UserRole.ADMIN) {
      return this.artistRepository.find();
    }
    return this.artistRepository.findBy({ galleryId: user.userId });
  }

  /**
   * Retrieves a single artist by ID, checking that the user has permission to access it.
   * @param id - The artist ID
   * @param user - The authenticated user making the request
   * @returns The artist entity
   * @throws {ForbiddenException} If the artist belongs to another gallery and user is not admin
   */
  async findOne(id: number, user: SafeUser): Promise<Artist> {
    const artist = await this.findOrThrow(id);
    if (user.role !== UserRole.ADMIN && artist.galleryId !== user.userId) {
      throw new ForbiddenException('Artist belongs to another gallery');
    }
    return artist;
  }

  /**
   * Updates an artist's information.
   * @param id - The artist ID
   * @param dto - The update data
   * @param user - The authenticated user making the request
   * @returns The updated artist entity
   * @throws {ForbiddenException} If the artist belongs to another gallery and user is not admin
   */
  async update(
    id: number,
    dto: UpdateArtistDto,
    user: SafeUser,
  ): Promise<Artist> {
    const artist = await this.findOrThrow(id);
    if (user.role !== UserRole.ADMIN && artist.galleryId !== user.userId) {
      throw new ForbiddenException('Artist belongs to another gallery');
    }
    Object.assign(artist, dto);
    return this.artistRepository.save(artist);
  }

  /**
   * Transfers an artist to another gallery. Non-sold artworks are also transferred.
   * @param id - The artist ID
   * @param galleryId - The ID of the target gallery
   * @returns The updated artist entity
   * @throws {BadRequestException} If target user is not a gallery
   */
  async transfer(id: number, galleryId: number): Promise<Artist> {
    const artist = await this.findOrThrow(id);
    const gallery = await this.userService.findOneBy({ userId: galleryId });
    if (!gallery || gallery.role !== UserRole.GALLERY) {
      throw new BadRequestException('Target user is not a gallery');
    }
    artist.galleryId = galleryId;
    artist.entryDate = today();

    return this.dataSource.transaction(async (manager) => {
      // Sold artworks keep their original galleryId so past sales/commission reports stay attributed to the gallery that made the sale
      await manager
        .createQueryBuilder()
        .update(Artwork)
        .set({ galleryId })
        .where('artistId = :id AND status != :sold', {
          id,
          sold: ArtworkStatus.SOLD,
        })
        .execute();
      return manager.getRepository(Artist).save(artist);
    });
  }

  /**
   * Links an artist profile to a user account.
   * @param id - The artist ID
   * @param dto - Contains the userId to link
   * @param user - The authenticated user making the request
   * @returns The updated artist entity
   * @throws {ForbiddenException} If the artist belongs to another gallery and user is not admin
   * @throws {BadRequestException} If target user is not an artist account or already linked to another profile
   */
  async linkUser(
    id: number,
    dto: LinkArtistUserDto,
    user: SafeUser,
  ): Promise<Artist> {
    const artist = await this.findOrThrow(id);
    if (user.role !== UserRole.ADMIN && artist.galleryId !== user.userId) {
      throw new ForbiddenException('Artist belongs to another gallery');
    }
    const target = await this.userService.findOneBy({ userId: dto.userId });
    if (!target || target.role !== UserRole.ARTIST) {
      throw new BadRequestException('Target user is not an artist account');
    }
    const alreadyLinked = await this.artistRepository.findOneBy({
      userId: dto.userId,
    });
    if (alreadyLinked && alreadyLinked.id !== id) {
      throw new BadRequestException(
        'This account is already linked to another artist profile',
      );
    }
    artist.userId = dto.userId;
    return this.artistRepository.save(artist);
  }

  /**
   * Finds an artist profile by the associated user ID.
   * @param userId - The user ID to search for
   * @returns The artist entity
   * @throws {NotFoundException} If no artist profile is linked to this account
   */
  async findByUserId(userId: number): Promise<Artist> {
    const artist = await this.artistRepository.findOneBy({ userId });
    if (!artist) {
      throw new NotFoundException('No artist profile linked to this account');
    }
    return artist;
  }

  /**
   * Finds an artist by ID or throws a NotFoundException.
   * @param id - The artist ID
   * @returns The artist entity
   * @throws {NotFoundException} If artist not found
   */
  private async findOrThrow(id: number): Promise<Artist> {
    const artist = await this.artistRepository.findOneBy({ id });
    if (!artist) {
      throw new NotFoundException('Artist not found');
    }
    return artist;
  }
}
