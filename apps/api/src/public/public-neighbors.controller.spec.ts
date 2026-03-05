import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { PublicNeighborsController } from './public-neighbors.controller';

describe('PublicNeighborsController (unit)', () => {
  let controller: PublicNeighborsController;

  const prismaMock = {
    userProfile: { count: jest.fn() },
  } as unknown as PrismaService;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-01-10T00:00:00.000Z'));

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicNeighborsController],
      providers: [{ provide: PrismaService, useValue: prismaMock }],
    }).compile();

    controller = module.get(PublicNeighborsController);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns 0 + thresholdApplied when count < minCount', async () => {
    prismaMock.userProfile.count.mockResolvedValue(2);

    const res = await controller.metrics({
      plz: '12345',
      days: 30,
      minCount: 3,
    } as any);

    const callArg = prismaMock.userProfile.count.mock.calls[0][0];
    expect(callArg.where.plz).toBe('12345');
    expect(callArg.where.user.lastActiveAt.gte).toEqual(
      new Date('2025-12-11T00:00:00.000Z'),
    );

    expect(res).toEqual({
      plz: '12345',
      windowDays: 30,
      minCount: 3,
      activeNeighbors: 0,
      thresholdApplied: true,
    });
  });

  it('returns count when count >= minCount', async () => {
    prismaMock.userProfile.count.mockResolvedValue(5);

    const res = await controller.metrics({
      plz: '12345',
      days: 7,
      minCount: 3,
    } as any);

    expect(res.activeNeighbors).toBe(5);
    expect(res.thresholdApplied).toBe(false);
  });

  it('applies defaults when days/minCount are missing', async () => {
    prismaMock.userProfile.count.mockResolvedValue(0);

    const res = await controller.metrics({ plz: '12345' } as any);

    expect(res.windowDays).toBe(30);
    expect(res.minCount).toBe(3);
  });
});
