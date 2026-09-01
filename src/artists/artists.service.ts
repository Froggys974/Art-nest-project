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

  async create(dto: CreateArtistDto, galleryId: number): Promise<Artist> {
    const artist = this.artistRepository.create({
      ...dto,
      entryDate: dto.entryDate ?? today(),
      galleryId,
    });
    return this.artistRepository.save(artist);
  }

  async findAll(user: SafeUser): Promise<Artist[]> {
    if (user.role === UserRole.ADMIN) {
      return this.artistRepository.find();
    }
    return this.artistRepository.findBy({ galleryId: user.userId });
  }

  async findOne(
    id: number,
    user: SafeUser,
    includeArtworks = false,
  ): Promise<Artist> {
    const artist = includeArtworks
      ? await this.findWithArtworks(id)
      : await this.findOrThrow(id);
    if (user.role !== UserRole.ADMIN && artist.galleryId !== user.userId) {
      throw new ForbiddenException('Artist belongs to another gallery');
    }
    return artist;
  }

  private async findWithArtworks(id: number): Promise<Artist> {
    const artist = await this.artistRepository.findOne({
      where: { id },
      relations: { artworks: true },
    });
    if (!artist) {
      throw new NotFoundException('Artist not found');
    }
    return artist;
  }

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

  async findByUserId(userId: number): Promise<Artist> {
    const artist = await this.artistRepository.findOneBy({ userId });
    if (!artist) {
      throw new NotFoundException('No artist profile linked to this account');
    }
    return artist;
  }

  private async findOrThrow(id: number): Promise<Artist> {
    const artist = await this.artistRepository.findOneBy({ id });
    if (!artist) {
      throw new NotFoundException('Artist not found');
    }
    return artist;
  }
}
