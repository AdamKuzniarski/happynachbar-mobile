import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('API E2E', () => {
  let app: INestApplication;

  const password = 'supersecret123';
  const email = `e2e+${Date.now()}@b.de`;
  let token = '';
  const plz = '63073';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  it('GET /health -> 200', async () => {
    await request(app.getHttpServer()).get('/health').expect(200);
  });

  it('POST /auth/signup -> creates user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password })
      .expect(201);

    expect(res.body.email).toBe(email.toLowerCase());
    expect(res.body).toHaveProperty('id');
  });

  it('POST /auth/login -> returns token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    expect(res.body).toHaveProperty('access_token');
    token = res.body.access_token;
  });

  it('GET /auth/me -> 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ plz })
      .expect(200);

    expect(res.body).toHaveProperty('userId');
    expect(res.body).toHaveProperty('email');
  });
  it('PATCH /users/me set PLZ -> 200', async () => {
    await request(app.getHttpServer())
      .patch('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ plz })
      .expect(200);
  });

  it('GET /public/neighbors/metrics -> stable response', async () => {
    const res = await request(app.getHttpServer())
      .get(`/public/neighbors/metrics?plz=${plz}&days=30&minCount=1`)
      .expect(200);

    expect(res.body).toMatchObject({
      plz,
      windowDays: 30,
      minCount: 1,
    });
    expect(typeof res.body.activeNeighbors).toBe('number');
    expect(typeof res.body.thresholdApplied).toBe('boolean');
  });

  it('GET /neighbors/metrics (auth) -> 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/neighbors/metrics?days=30&minCount=1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty('plz');
    expect(res.body).toHaveProperty('activeNeighbors');
  });

  it('GET /neighbors/metrics without token -> 401', async () => {
    await request(app.getHttpServer()).get('/neighbors/metrics').expect(401);
  });

  it('GET /public/neighbors/metrics invalid plz -> 400', async () => {
    await request(app.getHttpServer())
      .get('/public/neighbors/metrics?plz=12ab3')
      .expect(400);
  });
});
