import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ActivityCategory as PrismaActivityCategory,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateActivityDto,
  UpdateActivityDto,
  ListActivitiesQueryDto,
} from './dto/activities.input.dto';
import { ListActivitiesResponseDto } from './dto/list-activities.response.dto';
import { ActivityCardDto, ActivityDetailDto } from './dto/activity.dto';
import { ActivityCategory as ApiActivityCategory } from './dto/activity-category.enum';

type ParticipantRow = {
  id: string;
  displayName: string | null;
};

const activityListInclude = Prisma.validator<Prisma.ActivityInclude>()({
  images: { orderBy: { sortOrder: 'asc' }, take: 1 },
  createdBy: {
    include: { profile: { select: { displayName: true } } },
  },
  _count: { select: { participants: true } },
});

type ActivityListRow = Prisma.ActivityGetPayload<{
  include: typeof activityListInclude;
}>;

const activityDetailInclude = Prisma.validator<Prisma.ActivityInclude>()({
  images: { orderBy: { sortOrder: 'asc' } },
  createdBy: {
    include: { profile: { select: { displayName: true } } },
  },
  _count: { select: { participants: true } },
});

type ActivityDetailRow = Prisma.ActivityGetPayload<{
  include: typeof activityDetailInclude;
}>;

type ParticipantListRow = Prisma.ActivityParticipantGetPayload<{
  select: {
    user: {
      select: {
        id: true;
        profile: { select: { displayName: true } };
      };
    };
  };
}>;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  //Public route GET /activities
  async list(q: ListActivitiesQueryDto): Promise<ListActivitiesResponseDto> {
    const take = clamp(q.take ?? 20, 1, 50);

    const where: Prisma.ActivityWhereInput = { status: 'ACTIVE' };

    if (q.plz) {
      where.plz = q.plz.length === 5 ? q.plz : { startsWith: q.plz };
    }
    if (q.category)
      where.category = q.category as unknown as PrismaActivityCategory;
    if (q.createdById) where.createdById = q.createdById;

    if (q.q?.trim()) {
      const term = q.q.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }

    //  Zeitraumfilter
    if (q.startFrom || q.startTo) {
      const createdRange: Prisma.DateTimeFilter = {};
      const scheduledRange: Prisma.DateTimeNullableFilter = {};

      if (q.startFrom) {
        const date = new Date(q.startFrom);
        createdRange.gte = date;
        scheduledRange.gte = date;
      }

      if (q.startTo) {
        const date = new Date(q.startTo);
        createdRange.lte = date;
        scheduledRange.lte = date;
      }

      const existingAnd = Array.isArray(where.AND)
        ? where.AND
        : where.AND
          ? [where.AND]
          : [];

      where.AND = [
        ...existingAnd,
        {
          OR: [
            { scheduledAt: scheduledRange },
            { scheduledAt: null, createdAt: createdRange },
          ],
        },
      ];
    }

    const [totalCount, rows] = await this.prisma.$transaction(
      async (tx): Promise<[number, ActivityListRow[]]> => {
        const total = await tx.activity.count({ where });
        const items = await tx.activity.findMany({
          where,
          take: take + 1,
          ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          include: activityListInclude,
        });
        return [total, items];
      },
    );

    const hasMore = rows.length > take;
    const page = rows.slice(0, take);
    const nextCursor = hasMore && page.length ? page[page.length - 1].id : null;

    const items: ActivityCardDto[] = page.map((a) => ({
      id: a.id,
      title: a.title,
      category: a.category as ApiActivityCategory,
      startAt: a.scheduledAt ?? a.createdAt,
      locationLabel: undefined, // optional in DTO
      plz: a.plz,
      createdBy: {
        id: a.createdBy.id,
        displayName: a.createdBy.profile?.displayName ?? 'Neighbor',
      },
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      thumbnailUrl: a.images[0]?.url ?? null,
      participantsCount: a._count?.participants ?? 0,
    }));

    return { items, nextCursor, totalCount };
  }

  // Detail public route GET /activities/:id

  async getById(id: string): Promise<ActivityDetailDto> {
    const a = (await this.prisma.activity.findFirst({
      where: { id, status: 'ACTIVE' },
      include: activityDetailInclude,
    })) as ActivityDetailRow | null;

    if (!a) throw new NotFoundException('Activity not found');

    return {
      id: a.id,
      title: a.title,
      description: a.description ?? undefined,
      category: a.category as ApiActivityCategory,
      startAt: a.scheduledAt ?? a.createdAt,
      plz: a.plz,
      locationLabel: undefined,
      thumbnailUrl: a.images[0]?.url ?? null,
      createdById: a.createdBy.id,
      createdBy: {
        id: a.createdBy.id,
        displayName: a.createdBy.profile?.displayName ?? 'Neighbor',
      },
      images: a.images.map((img) => ({
        url: img.url,
        sortOrder: img.sortOrder,
        alt: img.alt ?? undefined,
      })),
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      participantsCount: a._count?.participants ?? 0,
    };
  }

  // Create (auth)

  async create(
    userId: string,
    dto: CreateActivityDto,
  ): Promise<ActivityDetailDto> {
    const a = await this.prisma.activity.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category as PrismaActivityCategory,
        status: 'ACTIVE',
        plz: dto.plz,
        scheduledAt: dto.startAt ? new Date(dto.startAt) : null,
        createdById: userId,
        images: dto.imageUrls?.length
          ? {
              create: dto.imageUrls.map((url, idx) => ({
                url,
                sortOrder: idx,
                alt: dto.title,
              })),
            }
          : undefined,
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        createdBy: {
          select: { id: true, profile: { select: { displayName: true } } },
        },
      },
    });

    await this.prisma.conversation.create({
      data: {
        activityId: a.id,
        type: 'GROUP',
        participantAId: userId,
        participantBId: userId,
        participants: { create: { userId } },
      },
      select: { id: true },
    });

    return this.getById(a.id);
  }

  // Update (auth + owner)
  async update(
    userId: string,
    id: string,
    dto: UpdateActivityDto,
  ): Promise<ActivityDetailDto> {
    const existing = await this.prisma.activity.findUnique({
      where: { id },
      select: { id: true, createdById: true, status: true },
    });

    if (!existing || existing.status !== 'ACTIVE')
      throw new NotFoundException('Activity not found');
    if (existing.createdById !== userId)
      throw new ForbiddenException('Not owner');

    if (dto.imageUrls) {
      await this.prisma.activityImage.deleteMany({ where: { activityId: id } });
      if (dto.imageUrls.length) {
        await this.prisma.activityImage.createMany({
          data: dto.imageUrls.map((url, idx) => ({
            activityId: id,
            url,
            sortOrder: idx,
            alt: dto.title ?? 'Activity image',
          })),
        });
      }
    }

    await this.prisma.activity.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category as PrismaActivityCategory,
        plz: dto.plz,
        scheduledAt: dto.startAt ? new Date(dto.startAt) : undefined,
      },
    });

    return this.getById(id);
  }

  // Delete(auth + owner) -> soft delete -die Dateien werden Archiviert- nicht mehr auf der seite zu sehen, aber in DB existent
  async archive(userId: string, id: string): Promise<{ ok: true }> {
    const existing = await this.prisma.activity.findUnique({
      where: { id },
      select: { id: true, createdById: true, status: true },
    });

    if (!existing || existing.status !== 'ACTIVE')
      throw new NotFoundException('Activity not found');
    if (existing.createdById !== userId)
      throw new ForbiddenException('Not owner');

    await this.prisma.activity.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    return { ok: true };
  }

  async join(userId: string, activityId: string): Promise<{ ok: true }> {
    const existing = await this.prisma.activity.findUnique({
      where: { id: activityId },
      select: { id: true, status: true, createdById: true },
    });

    if (!existing || existing.status !== 'ACTIVE')
      throw new NotFoundException('Activity not found');

    try {
      await this.prisma.activityParticipant.create({
        data: { activityId, userId },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return { ok: true };
      }
      throw error;
    }

    const group = await this.prisma.conversation.findFirst({
      where: { activityId, type: 'GROUP' },
      select: { id: true },
    });

    if (!group) {
      await this.prisma.conversation.create({
        data: {
          activityId,
          type: 'GROUP',
          participantAId: existing.createdById,
          participantBId: existing.createdById,
          participants: {
            create: [
              { userId: existing.createdById },
              ...(userId === existing.createdById ? [] : [{ userId }]),
            ],
          },
        },
        select: { id: true },
      });
    } else {
      await this.prisma.conversationParticipant.upsert({
        where: {
          conversationId_userId: { conversationId: group.id, userId },
        },
        update: {},
        create: { conversationId: group.id, userId },
      });
    }

    return { ok: true };
  }

  async leave(userId: string, activityId: string): Promise<{ ok: true }> {
    await this.prisma.activityParticipant.deleteMany({
      where: { activityId, userId },
    });

    const group = await this.prisma.conversation.findFirst({
      where: { activityId, type: 'GROUP' },
      select: { id: true },
    });

    if (group) {
      await this.prisma.conversationParticipant.deleteMany({
        where: { conversationId: group.id, userId },
      });
    }

    return { ok: true };
  }

  async isJoined(
    userId: string,
    activityId: string,
  ): Promise<{ joined: boolean }> {
    const existing = await this.prisma.activity.findUnique({
      where: { id: activityId },
      select: { id: true, status: true },
    });

    if (!existing || existing.status !== 'ACTIVE')
      throw new NotFoundException('Activity not found');

    const joined = await this.prisma.activityParticipant.findFirst({
      where: { activityId, userId },
      select: { id: true },
    });

    return { joined: !!joined };
  }

  async listParticipants(
    userId: string,
    activityId: string,
  ): Promise<ParticipantRow[]> {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      select: { id: true, status: true, createdById: true },
    });

    if (!activity || activity.status !== 'ACTIVE')
      throw new NotFoundException('Activity not found');
    if (activity.createdById !== userId)
      throw new ForbiddenException('Not owner');

    const rows = (await this.prisma.activityParticipant.findMany({
      where: { activityId },
      orderBy: { createdAt: 'desc' },
      select: {
        user: {
          select: {
            id: true,
            profile: { select: { displayName: true } },
          },
        },
      },
    })) as ParticipantListRow[];

    return rows.map((r) => ({
      id: r.user.id,
      displayName: r.user.profile?.displayName ?? null,
    }));
  }
}
