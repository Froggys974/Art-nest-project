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

describe('ReportsController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let artistRepository: Repository<Artist>;

  const suffix = Date.now();
  let adminToken: string;
  let galleryId: number;
  let galleryToken: string;
  let artistUserId: number;
  let artistUserToken: string;
  let artistId: number;
  let adminId: number;

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

    // Admin
    const admin = await userRepository.save(
      userRepository.create({
        username: `e2e_admin_rep_${suffix}`,
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

    // Gallery
    const gallery = await userRepository.save(
      userRepository.create({
        username: `e2e_gallery_rep_${suffix}`,
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

    // Artist
    const artistUser = await userRepository.save(
      userRepository.create({
        username: `e2e_artist_rep_${suffix}`,
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

    const artist = await artistRepository.save(
      artistRepository.create({
        firstName: 'E2E',
        lastName: 'ArtistRep',
        nationality: 'Testland',
        entryDate: '2024-01-01',
        galleryId,
        userId: artistUserId,
      }),
    );
    artistId = artist.id;
  });

  afterAll(async () => {
    if (artistId) await artistRepository.delete({ id: artistId });
    if (adminId) await userRepository.delete({ userId: adminId });
    if (galleryId) await userRepository.delete({ userId: galleryId });
    if (artistUserId) await userRepository.delete({ userId: artistUserId });
    await app.close();
  });

  describe('GET /reports/admin', () => {
    it('returns 200 for admin', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/reports/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('rejects gallery user', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/reports/admin')
        .set('Authorization', `Bearer ${galleryToken}`)
        .expect(403);
    });
  });

  describe('GET /reports/gallery', () => {
    it('returns 200 for gallery', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/reports/gallery')
        .set('Authorization', `Bearer ${galleryToken}`)
        .expect(200);
    });
  });

  describe('GET /reports/artists/me', () => {
    it('returns 200 for linked artist', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/reports/artists/me')
        .set('Authorization', `Bearer ${artistUserToken}`)
        .expect(200);
    });
  });

  describe('GET /reports/artists/:id', () => {
    it('returns 200 for admin', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/reports/artists/${artistId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });
});
