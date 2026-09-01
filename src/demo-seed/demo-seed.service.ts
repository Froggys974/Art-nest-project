import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from 'src/user/user.service';
import { UserRole } from 'src/user/user-role.enum';
import { SafeUser } from 'src/user/types/safe-user.type';
import { ArtistsService } from 'src/artists/artists.service';
import { Artist } from 'src/artists/artist.entity';
import { ArtworksService } from 'src/artworks/artworks.service';
import { Artwork } from 'src/artworks/artwork.entity';
import { ArtworkStatus } from 'src/artworks/artwork-status.enum';

const DEMO_PASSWORD = 'demo12345';

@Injectable()
export class DemoSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoSeedService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly userService: UserService,
    private readonly artistsService: ArtistsService,
    private readonly artworksService: ArtworksService,
    @InjectRepository(Artist)
    private readonly artistRepository: Repository<Artist>,
    @InjectRepository(Artwork)
    private readonly artworkRepository: Repository<Artwork>,
  ) {}

  async onApplicationBootstrap() {
    if (this.config.get<string>('NODE_ENV') === 'production') {
      return;
    }
    const existing = await this.userService.findOneBy({
      username: 'demo_gallery',
    });
    if (existing) {
      return;
    }

    const gallery = await this.userService.create(
      'demo_gallery',
      DEMO_PASSWORD,
      UserRole.GALLERY,
    );
    await this.userService.validate(gallery.userId);
    const galleryActor = this.asActor(
      gallery.userId,
      gallery.username,
      UserRole.GALLERY,
    );

    const artist = await this.artistsService.create(
      {
        firstName: 'Elena',
        lastName: 'Voss',
        nationality: 'German',
        biography: 'Contemporary painter, working in oil and mixed media.',
      },
      gallery.userId,
    );

    const artistUser = await this.userService.create(
      'demo_artist',
      DEMO_PASSWORD,
      UserRole.ARTIST,
    );
    await this.artistsService.linkUser(
      artist.id,
      { userId: artistUser.userId },
      galleryActor,
    );

    await this.userService.create(
      'demo_collector',
      DEMO_PASSWORD,
      UserRole.COLLECTOR,
    );

    await this.artworksService.create(
      {
        title: 'Golden Hour',
        description: 'Oil on canvas, from the 2023 studio series.',
        creationYear: 2023,
        technique: 'Oil on canvas',
        dimensions: '80x100cm',
        price: 9000,
        reservePrice: 6000,
        artistId: artist.id,
      },
      gallery.userId,
    );

    await this.seedArtworkLimitFixture(gallery.userId);

    this.logger.log(
      'Demo data seeded: demo_gallery / demo_artist / demo_collector ' +
        `(password: ${DEMO_PASSWORD})`,
    );
  }

  private async seedArtworkLimitFixture(galleryId: number): Promise<void> {
    const limitArtist = await this.artistsService.create(
      { firstName: 'Marcus', lastName: 'Lindqvist', nationality: 'Swedish' },
      galleryId,
    );
    const depositDate = new Date().toISOString().slice(0, 10);
    const filler = Array.from({ length: 49 }, (_, i) =>
      this.artworkRepository.create({
        title: `Study #${i + 1}`,
        description: 'Filler piece seeded to demo the 50-artwork cap.',
        creationYear: 2022,
        technique: 'Ink on paper',
        dimensions: '20x20cm',
        price: 500,
        reservePrice: 300,
        status: ArtworkStatus.AVAILABLE,
        depositDate,
        artistId: limitArtist.id,
        galleryId,
      }),
    );
    await this.artworkRepository.save(filler);
  }

  private asActor(userId: number, username: string, role: UserRole): SafeUser {
    return { userId, username, role, isValidated: true };
  }
}
