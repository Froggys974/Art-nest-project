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

describe('ArtworksController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let artistRepository: Repository<Artist>;
  let artworkRepository: Repository<Artwork>;
  let historyRepository: Repository<ArtworkStatusHistory>;

  const suffix = Date.now();
  let adminToken: string;
  let galleryId: number;
  let galleryToken: string;
  let artistUserId: number;
  let artistUserToken: string;
  let adminId: number;
  let artist: Artist;
  let artworkId: number;

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
    historyRepository = moduleFixture.get(getRepositoryToken(ArtworkStatusHistory));

    const passwordHash = await bcrypt.hash('password123', 10);

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

    // Artist user
    const artistUser = await userRepository.save(
      userRepository.create({
        username: `e2e_artist_${suffix}`,
        password: passwordHash,
        role: UserRole.ARTIST,
        isValidated: true,
      }),
    );
    artistUserId = artistUser.userId;
    const loginArtist = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: artistUser.username, password: 'password123' });
    artistUserToken = loginArtist.body.data.access_token;

    artist = await artistRepository.save(
      artistRepository.create({
        firstName: 'Picasso',
        lastName: 'E2E',
        nationality: 'Spain',
        entryDate: '1900-01-01',
        galleryId,
        userId: artistUserId,
      }),
    );
  });

  afterAll(async () => {
    if (artworkId) await historyRepository.delete({ artworkId: artworkId });
    if (artworkId) await artworkRepository.delete({ id: artworkId });
    if (artist) await artistRepository.delete({ id: artist.id });
    if (artistUserId) await userRepository.delete({ userId: artistUserId });
    if (galleryId) await userRepository.delete({ userId: galleryId });
    if (adminId) await userRepository.delete({ userId: adminId });
    await app.close();
  });

  describe('POST /artworks', () => {
    it('creates an artwork successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/artworks')
        .set('Authorization', `Bearer ${galleryToken}`)
        .send({
          title: 'Guernica',
          description: 'A famous painting',
          creationYear: 1937,
          technique: 'Oil on canvas',
          dimensions: '349.3 cm × 776.6 cm',
          price: 1500000.0,
          reservePrice: 1000000.0,
          depositDate: '1937-01-01',
          artistId: artist.id,
        })
        .expect(201);

      expect(res.body.data.title).toBe('Guernica');
      expect(res.body.data.galleryId).toBe(galleryId);
      artworkId = res.body.data.id;
    });
  });

  describe('GET /artworks', () => {
    it('lists all artworks', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/artworks')
        .set('Authorization', `Bearer ${galleryToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.some((a: any) => a.id === artworkId)).toBe(true);
    });
  });

  describe('GET /artworks/me', () => {
    it('lists artworks for logged in artist', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/artworks/me')
        .set('Authorization', `Bearer ${artistUserToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(artworkId);
    });
  });

  describe('GET /artworks/:id', () => {
    it('returns an artwork by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/artworks/${artworkId}`)
        .set('Authorization', `Bearer ${galleryToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(artworkId);
    });
  });

  describe('PATCH /artworks/:id', () => {
    it('updates an artwork', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/artworks/${artworkId}`)
        .set('Authorization', `Bearer ${galleryToken}`)
        .send({ title: 'Guernica Updated' })
        .expect(200);

      expect(res.body.data.title).toBe('Guernica Updated');
    });
  });

  describe('PATCH /artworks/:id/status', () => {
    it('updates artwork status', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/artworks/${artworkId}/status`)
        .set('Authorization', `Bearer ${galleryToken}`)
        .send({ status: ArtworkStatus.ON_LOAN })
        .expect(200);

      expect(res.body.data.status).toBe(ArtworkStatus.ON_LOAN);
    });
  });

  describe('GET /artworks/:id/history', () => {
    it('gets the status history of an artwork', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/artworks/${artworkId}/history`)
        .set('Authorization', `Bearer ${galleryToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });
});
