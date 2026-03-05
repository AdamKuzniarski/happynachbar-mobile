import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService (unit)', () => {
  let service: UsersService;

  const prismaMock = {
    userProfile: { upsert: jest.fn() },
  } as unknown as PrismaService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  it('upserts user profile when plz is provided', async () => {
    prismaMock.userProfile.upsert.mockResolvedValue({
      userId: 'u1',
      plz: '12345',
    });

    await expect(service.updateMe('u1', { plz: '12345' })).resolves.toEqual({
      ok: true,
    });

    expect(prismaMock.userProfile.upsert).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      update: { plz: '12345' },
      create: { userId: 'u1', plz: '12345' },
    });
  });

  it('does not touch DB when plz is not provided', async () => {
    await expect(service.updateMe('u1', {})).resolves.toEqual({ ok: true });
    expect(prismaMock.userProfile.upsert).not.toHaveBeenCalled();
  });
});
