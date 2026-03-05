import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { HealthController } from './health.controller';

describe('HealthController (unit)', () => {
  let controller: HealthController;

  const prismaMock = {
    $queryRaw: jest.fn(),
    user: { count: jest.fn() },
  } as unknown as PrismaService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prismaMock }],
    }).compile();

    controller = module.get(HealthController);
  });

  it('GET /health returns status ok', () => {
    expect(controller.getHealth()).toEqual({ status: 'ok' });
  });

  it('GET /health/db checks DB connectivity and returns user count', async () => {
    prismaMock.$queryRaw.mockResolvedValue(undefined);
    prismaMock.user.count.mockResolvedValue(7);

    await expect(controller.getDbHealth()).resolves.toEqual({
      status: 'db ok',
      usersCount: 7,
    });

    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
    expect(prismaMock.user.count).toHaveBeenCalledTimes(1);
  });
});
