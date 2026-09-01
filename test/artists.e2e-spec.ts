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

describe('ArtistsController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let artistRepository: Repository<Artist>;

  const suffix = Date.now();
  let adminId: number;
  let adminToken: string;
  let galleryId: number;
  let galleryToken: string;
  let galleryId2: number;
  let artistUserId: number;
  let artistUserToken: string;
  let artistId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    userRepository = moduleFixture.get(getRepositoryToken(User));
    artistRepository = moduleFixture.get(getRepositoryToken(Artist));

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
    adminId = admin.userId;

    // Gallery 1 user
    const gallery = await userRepository.save(
      userRepository.create({
        username: `e2e_gallery_${suffix}`,
        password: passwordHash,
        role: UserRole.GALLERY,
        isValidated: true,
      }),
    );
    galleryId = gallery.userId;

    // Gallery 2 user
    const gallery2 = await userRepository.save(
      userRepository.create({
        username: `e2e_gallery2_${suffix}`,
        password: passwordHash,
        role: UserRole.GALLERY,
        isValidated: true,
      }),
    );
    galleryId2 = gallery2.userId;

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

    const loginAdmin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: admin.username, password: 'password123' });
    adminToken = loginAdmin.body.data.access_token;

    const loginGallery = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: gallery.username, password: 'password123' });
    galleryToken = loginGallery.body.data.access_token;

    const loginArtist = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: artistUser.username, password: 'password123' });
    artistUserToken = loginArtist.body.data.access_token;
  });

  afterAll(async () => {
    if (artistId) await artistRepository.delete({ id: artistId });
    if (adminId) await userRepository.delete({ userId: adminId });
    if (galleryId) await userRepository.delete({ userId: galleryId });
    if (galleryId2) await userRepository.delete({ userId: galleryId2 });
    if (artistUserId) await userRepository.delete({ userId: artistUserId });
    await app.close();
  });

  describe('POST /artists', () => {
    it('rejects if not gallery role', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/artists')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'John',
          lastName: 'Doe',
          nationality: 'Testland',
          entryDate: '2024-01-01',
        })
        .expect(403);
    });

    it('creates an artist successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/artists')
        .set('Authorization', `Bearer ${galleryToken}`)
        .send({
          firstName: 'John',
          lastName: 'Doe',
          nationality: 'Testland',
          entryDate: '2024-01-01',
        })
        .expect(201);

      expect(res.body.data.firstName).toBe('John');
      expect(res.body.data.galleryId).toBe(galleryId);
      artistId = res.body.data.id;
    });
  });

  describe('GET /artists', () => {
    it('lists artists for gallery', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/artists')
        .set('Authorization', `Bearer ${galleryToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].id).toBe(artistId);
    });
  });

  describe('GET /artists/:id', () => {
    it('returns an artist by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/artists/${artistId}`)
        .set('Authorization', `Bearer ${galleryToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(artistId);
    });
  });

  describe('PATCH /artists/:id', () => {
    it('updates an artist', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/artists/${artistId}`)
        .set('Authorization', `Bearer ${galleryToken}`)
        .send({ firstName: 'Jane' })
        .expect(200);

      expect(res.body.data.firstName).toBe('Jane');
    });
  });

  describe('PATCH /artists/:id/link-user', () => {
    it('links an artist to a user account', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/artists/${artistId}/link-user`)
        .set('Authorization', `Bearer ${galleryToken}`)
        .send({ userId: artistUserId })
        .expect(200);

      expect(res.body.data.userId).toBe(artistUserId);
    });
  });

  describe('GET /artists/me', () => {
    it('gets the artist profile for the logged in artist', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/artists/me')
        .set('Authorization', `Bearer ${artistUserToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(artistId);
      expect(res.body.data.userId).toBe(artistUserId);
    });
  });

  describe('PATCH /artists/:id/transfer', () => {
    it('transfers artist to another gallery', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/artists/${artistId}/transfer`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ galleryId: galleryId2 })
        .expect(200);

      expect(res.body.data.galleryId).toBe(galleryId2);
    });
  });
});
