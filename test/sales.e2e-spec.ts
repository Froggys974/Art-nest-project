import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from 'src/app.module';
import { configureApp } from 'src/bootstrap';
import { User } from 'src/user/user.entity';
import { UserRole } from 'src/user/user-role.enum';
import { Artist } from 'src/artists/artist.entity';
import { Artwork } from 'src/artworks/artwork.entity';
import { ArtworkStatus } from 'src/artworks/artwork-status.enum';
import { ArtworkStatusHistory } from 'src/artworks/artwork-status-history.entity';
import { Sale } from 'src/sales/sale.entity';

interface Envelope<T> {
  data: T;
  meta: { path: string; method: string };
}
interface BusinessError {
  rule: string;
}

describe('POST /sales (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let artistRepository: Repository<Artist>;
  let artworkRepository: Repository<Artwork>;
  let historyRepository: Repository<ArtworkStatusHistory>;
  let saleRepository: Repository<Sale>;

  const suffix = Date.now();
  let galleryId: number;
  let collectorId: number;
  let collectorToken: string;
  let artist: Artist;
  let artwork: Artwork;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    userRepository = moduleFixture.get(getRepositoryToken(User));
    artistRepository = moduleFixture.get(getRepositoryToken(Artist));
    artworkRepository = moduleFixture.get(getRepositoryToken(Artwork));
    historyRepository = moduleFixture.get(
      getRepositoryToken(ArtworkStatusHistory),
    );
    saleRepository = moduleFixture.get(getRepositoryToken(Sale));

    const passwordHash = await bcrypt.hash('password123', 10);
    const gallery = await userRepository.save(
      userRepository.create({
        username: `e2e_gallery_${suffix}`,
        password: passwordHash,
        role: UserRole.GALLERY,
        isValidated: true,
      }),
    );
    galleryId = gallery.userId;

    const collector = await userRepository.save(
      userRepository.create({
        username: `e2e_collector_${suffix}`,
        password: passwordHash,
        role: UserRole.COLLECTOR,
        isValidated: true,
      }),
    );
    collectorId = collector.userId;

    artist = await artistRepository.save(
      artistRepository.create({
        firstName: 'E2E',
        lastName: 'Artist',
        nationality: 'Testland',
        entryDate: '2024-01-01',
        galleryId,
      }),
    );

    artwork = await artworkRepository.save(
      artworkRepository.create({
        title: 'End to End',
        description: 'Seeded for the sales e2e test.',
        creationYear: 2024,
        technique: 'Oil on canvas',
        dimensions: '10x10cm',
        price: 9000,
        reservePrice: 6000,
        status: ArtworkStatus.AVAILABLE,
        depositDate: '2024-01-01',
        artistId: artist.id,
        galleryId,
      }),
    );

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: collector.username, password: 'password123' })
      .expect(200);
    collectorToken = (login.body as Envelope<{ access_token: string }>).data
      .access_token;
  });

  afterAll(async () => {
    await saleRepository.delete({ artworkId: artwork.id });
    await historyRepository.delete({ artworkId: artwork.id });
    await artworkRepository.delete({ id: artwork.id });
    await artistRepository.delete({ id: artist.id });
    await userRepository.delete({ userId: collectorId });
    await userRepository.delete({ userId: galleryId });
    await app.close();
  });

  it('rejects a sale below the reserve price', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/sales')
      .set('Authorization', `Bearer ${collectorToken}`)
      .send({ artworkId: artwork.id, salePrice: 5500 })
      .expect(422);

    expect((res.body as BusinessError).rule).toBe('BELOW_RESERVE_PRICE');
  });

  it('sells the artwork, computing the 35% commission tier', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/sales')
      .set('Authorization', `Bearer ${collectorToken}`)
      .send({ artworkId: artwork.id, salePrice: 8000 })
      .expect(201);

    const body = res.body as Envelope<{
      galleryCommission: number;
      artistBalance: number;
    }>;
    expect(body.data.galleryCommission).toBe(2800);
    expect(body.data.artistBalance).toBe(5200);
    // Confirms ResponseEnvelopeInterceptor ran on this response.
    expect(body.meta).toEqual({ path: '/api/v1/sales', method: 'POST' });
  });

  it('refuses to sell the same artwork twice', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/sales')
      .set('Authorization', `Bearer ${collectorToken}`)
      .send({ artworkId: artwork.id, salePrice: 8000 })
      .expect(422);

    expect((res.body as BusinessError).rule).toBe('ARTWORK_ALREADY_SOLD');
  });

  it('reflects the sold status when reading the artwork back', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/artworks/${artwork.id}`)
      .set('Authorization', `Bearer ${collectorToken}`)
      .expect(200);

    expect((res.body as Envelope<{ status: string }>).data.status).toBe('sold');
  });

  it('rejects the whole request when the body carries an unknown field', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/sales')
      .set('Authorization', `Bearer ${collectorToken}`)
      .send({ artworkId: artwork.id, salePrice: 8000, discountCode: 'VIP' })
      .expect(400);
  });

  it('rejects the request with no token at all', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/sales')
      .send({ artworkId: artwork.id, salePrice: 8000 })
      .expect(401);
  });
});
