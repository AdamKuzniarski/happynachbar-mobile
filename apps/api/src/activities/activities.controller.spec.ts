import { Test } from '@nestjs/testing';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';

describe('ActivitiesController', () => {
  it('delegates to ActivitiesService.list()', async () => {
    const listMock = jest
      .fn()
      .mockResolvedValue({ items: [], nextCursor: null });

    const moduleRef = await Test.createTestingModule({
      controllers: [ActivitiesController],
      providers: [{ provide: ActivitiesService, useValue: { list: listMock } }],
    }).compile();

    const controller = moduleRef.get(ActivitiesController);

    const q = { plz: '10115', take: 20 };
    const res = await controller.list(q as any);

    expect(listMock).toHaveBeenCalledWith(q);
    expect(res).toEqual({ items: [], nextCursor: null });
  });
});
