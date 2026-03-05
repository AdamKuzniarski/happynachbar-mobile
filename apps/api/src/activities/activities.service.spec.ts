import { ActivitiesService } from './activities.service';
import { ActivityCategory } from './dto/activity-category.enum';

describe('ActivitiesService', () => {
  it('returns items + nextCursor with deterministic pagination', async () => {
    const prismaMock = {
      $transaction: jest.fn(async (fn: any) => fn(prismaMock)),
      activity: { count: jest.fn().mockResolvedValue(3), findMany: jest.fn() },
    };

    const service = new ActivitiesService(prismaMock as any);

    const row = (id: string) => ({
      id,
      title: 'Spaziergang',
      description: null,
      category: 'OUTDOOR',
      status: 'ACTIVE',
      plz: '10115',
      scheduledAt: null,
      createdBy: { id: 'u1', profile: { displayName: 'Anna' } },
      images: [{ url: 'https://picsum.photos/seed/x/640/480', sortOrder: 0 }],
      createdAt: new Date('2026-01-01T10:00:00.000Z'),
      updatedAt: new Date('2026-01-01T10:00:00.000Z'),
    });

    prismaMock.activity.findMany.mockResolvedValue([
      row('a1'),
      row('a2'),
      row('a3'),
    ]); // take+1

    const res = await service.list({
      take: 2,
      category: ActivityCategory.OUTDOOR,
    } as any);

    expect(prismaMock.activity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 3,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        where: expect.objectContaining({ status: 'ACTIVE' }),
      }),
    );

    expect(res.items).toHaveLength(2);
    expect(res.nextCursor).toBe('a2');
    expect(res.items[0]).toMatchObject({
      id: 'a1',
      thumbnailUrl: expect.any(String),
      createdBy: { displayName: 'Anna' },
    });
  });

  it('uses cursor + skip:1', async () => {
    const prismaMock = {
      $transaction: jest.fn(async (fn: any) => fn(prismaMock)),
      activity: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const service = new ActivitiesService(prismaMock as any);

    await service.list({ cursor: 'a2', take: 20 } as any);

    expect(prismaMock.activity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: { id: 'a2' },
        skip: 1,
      }),
    );
  });
});
