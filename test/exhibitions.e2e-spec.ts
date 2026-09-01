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
import { Exhibition } from 'src/exhibitions/exhibition.entity';
import { ArtworkStatusHistory } from 'src/artworks/artwork-status-history.entity';

describe('ExhibitionsController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let artistRepository: Repository<Artist>;
  let artworkRepository: Repository<Artwork>;
  let exhibitionRepository: Repository<Exhibition>;
  let historyRepository: Repository<ArtworkStatusHistory>;

  const suffix = Date.now();
  let galleryId: number;
  let galleryToken: string;
  let adminToken: string;
  let adminId: number;
  let artist: Artist;
  let artwork: Artwork;
  let exhibitionId: number;

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
    exhibitionRepository = moduleFixture.get(getRepositoryToken(Exhibition));
    historyRepository = moduleFixture.get(getRepositoryToken(ArtworkStatusHistory));

    const passwordHash = await bcrypt.hash('password123', 10);

    // Gallery user
    const gallery = await userRepository.save(
      userRepository.create({
        username: `e2e_gallery_${suffix}`,
        password: passwordHash,
        role: UserRole.GALLERY,
        isValidated: true,
      }),
    );
    galleryId = gallery.userId;
    const loginGallery = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: gallery.username, password: 'password123' });
    galleryToken = loginGallery.body.data.access_token;

    // Admin user
    const admin = await userRepository.save(
      userRepository.create({
        username: `e2e_admin_${suffix}`,
        password: passwordHash,
        role: UserRole.ADMIN,
        isValidated: true,
      }),
    );
    const loginAdmin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: admin.username, password: 'password123' });
    adminToken = loginAdmin.body.data.access_token;
    adminId = admin.userId;

    artist = await artistRepository.save(
      artistRepository.create({
        firstName: 'E2E',
        lastName: 'Artist',
        nationality: 'Testland',
        entryDate: '2024-01-01',
        gallery: { userId: galleryId },
      }),
    );

    artwork = await artworkRepository.save(
      artworkRepository.create({
        title: 'E2E Artwork',
        description: 'Testing exhibitions',
        creationYear: 2024,
        technique: 'Oil',
        dimensions: '10x10',
        price: 1000,
        reservePrice: 500,
        status: ArtworkStatus.AVAILABLE,
        depositDate: '2024-01-01',
        artistId: artist.id,
        galleryId,
      }),
    );
  });

  afterAll(async () => {
    if (exhibitionId) await exhibitionRepository.delete({ id: exhibitionId });
    if (artwork) await historyRepository.delete({ artworkId: artwork.id });
    if (artwork) await artworkRepository.delete({ id: artwork.id });
    if (artist) await artistRepository.delete({ id: artist.id });
    if (adminId) await userRepository.delete({ userId: adminId });
    if (galleryId) await userRepository.delete({ userId: galleryId });
    await app.close();
  });

  describe('POST /exhibitions', () => {
    it('creates an exhibition successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/exhibitions')
        .set('Authorization', `Bearer ${galleryToken}`)
        .send({
          name: 'Spring E2E Exhibition',
          locationOrUrl: 'Paris',
          startDate: '2024-04-01',
          endDate: '2024-06-01',
          artworkIds: [artwork.id],
        })
        .expect(201);

      expect(res.body.data.name).toBe('Spring E2E Exhibition');
      exhibitionId = res.body.data.id;
    });

    it('changes artwork status to ON_LOAN', async () => {
      const updatedArtwork = await artworkRepository.findOneBy({ id: artwork.id });
      expect(updatedArtwork.status).toBe(ArtworkStatus.ON_LOAN);
    });
  });

  describe('GET /exhibitions', () => {
    it('lists all exhibitions', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/exhibitions')
        .set('Authorization', `Bearer ${galleryToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /exhibitions/:id', () => {
    it('returns an exhibition by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/exhibitions/${exhibitionId}`)
        .set('Authorization', `Bearer ${galleryToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(exhibitionId);
    });
  });

  describe('PATCH /exhibitions/:id/end', () => {
    it('ends an exhibition and resets artwork status', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/exhibitions/${exhibitionId}/end`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const updatedArtwork = await artworkRepository.findOneBy({ id: artwork.id });
      expect(updatedArtwork.status).toBe(ArtworkStatus.AVAILABLE);
    });
  });
});
