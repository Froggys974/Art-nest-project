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

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  const suffix = Date.now();
  let adminToken: string;
  let adminId: number;
  let galleryId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    userRepository = moduleFixture.get(getRepositoryToken(User));

    const passwordHash = await bcrypt.hash('password123', 10);

    // Admin user
    const admin = await userRepository.save(
      userRepository.create({
        username: `e2e_admin_user_${suffix}`,
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

    // Unvalidated gallery user
    const gallery = await userRepository.save(
      userRepository.create({
        username: `e2e_gallery_unval_${suffix}`,
        password: passwordHash,
        role: UserRole.GALLERY,
        isValidated: false,
      }),
    );
    galleryId = gallery.userId;
  });

  afterAll(async () => {
    if (galleryId) await userRepository.delete({ userId: galleryId });
    if (adminId) await userRepository.delete({ userId: adminId });
    await app.close();
  });

  describe('GET /users/profile', () => {
    it('returns the current user profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.username).toContain('e2e_admin_user_');
    });
  });

  describe('PATCH /users/:id/validate', () => {
    it('validates a user account (admin only)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/users/${galleryId}/validate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.isValidated).toBe(true);
    });

    it('rejects without admin role', async () => {
      // Trying to validate with an unauthenticated request should fail
      await request(app.getHttpServer())
        .patch(`/api/v1/users/${galleryId}/validate`)
        .expect(401);
    });
  });
});
