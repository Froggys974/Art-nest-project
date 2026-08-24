import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from 'src/user/user.service';
import { UserRole } from 'src/user/user-role.enum';
import { SafeUser } from 'src/user/types/safe-user.type';
import { Artist } from './artist.entity';
import { CreateArtistDto } from './dto/create-artist.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';

const today = (): string => new Date().toISOString().slice(0, 10);

@Injectable()
export class ArtistsService {
  constructor(
    @InjectRepository(Artist)
    private readonly artistRepository: Repository<Artist>,
    private readonly userService: UserService,
  ) {}

  async create(dto: CreateArtistDto, galleryId: number): Promise<Artist> {
    const artist = this.artistRepository.create({
      ...dto,
      entryDate: dto.entryDate ?? today(),
      galleryId,
    });
    return this.artistRepository.save(artist);
  }

  async findAll(): Promise<Artist[]> {
    return this.artistRepository.find();
  }

  async findOne(id: number): Promise<Artist> {
    const artist = await this.artistRepository.findOneBy({ id });
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
    const artist = await this.findOne(id);
    if (user.role !== UserRole.ADMIN && artist.galleryId !== user.userId) {
      throw new ForbiddenException('Artist belongs to another gallery');
    }
    Object.assign(artist, dto);
    return this.artistRepository.save(artist);
  }

  async transfer(id: number, galleryId: number): Promise<Artist> {
    const artist = await this.findOne(id);
    const gallery = await this.userService.findOneBy({ userId: galleryId });
    if (!gallery || gallery.role !== UserRole.GALLERY) {
      throw new BadRequestException('Target user is not a gallery');
    }
    artist.galleryId = galleryId;
    artist.entryDate = today();
    return this.artistRepository.save(artist);
  }
}
