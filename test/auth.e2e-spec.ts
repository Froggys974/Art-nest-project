import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { configureApp } from 'src/bootstrap';
import { UserRole } from 'src/user/user-role.enum';
import { User } from 'src/user/user.entity';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  const uniqueSuffix = Date.now().toString();
  const testUser = {
    username: `artist_test_${uniqueSuffix}`,
    password: 'password123',
    role: UserRole.ARTIST,
  };
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    userRepository = moduleFixture.get(getRepositoryToken(User));
  });

  afterAll(async () => {
    await userRepository.delete({ username: testUser.username });
    await app.close();
  });

  it('/api/v1/auth/register (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(201)
      .expect((res) => {
        expect(res.body.data.username).toBe(testUser.username);
        expect(res.body.data.role).toBe(testUser.role);
      });
  });

  it('/api/v1/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        username: testUser.username,
        password: testUser.password,
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.access_token).toBeDefined();
        expect(res.body.data.refresh_token).toBeDefined();
        jwtToken = res.body.data.access_token;
      });
  });

  it('/api/v1/users/profile (GET) - Success with Token', () => {
    return request(app.getHttpServer())
      .get('/api/v1/users/profile')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.username).toBe(testUser.username);
        expect(res.body.data.role).toBe(testUser.role);
      });
  });

  it('/api/v1/users/profile (GET) - Unauthorized without Token', () => {
    return request(app.getHttpServer())
      .get('/api/v1/users/profile')
      .expect(401);
  });
});
