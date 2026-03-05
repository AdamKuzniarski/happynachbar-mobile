import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityStatus,
  AuditAction,
  AuditEntityType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditLogService } from 'src/audit/audit-log.service';
import {
  AdminBulkActivityStatusDto,
  AdminListActivitiesQueryDto,
  AdminSetActivityStatusDto,
  AdminUpdateActivityDto,
} from './dto/admin-activities.dto';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

@Injectable()
export class AdminActivitiesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditLogService,
  ) {}

  async list(q: AdminListActivitiesQueryDto) {
    const take = clamp(q.take ?? 20, 1, 50);

    const where: Prisma.ActivityWhereInput = {};

    if (q.plz) where.plz = q.plz;
    if (q.category) where.category = q.category as any;
    if (q.createdById) where.createdById = q.createdById;
    if (q.status) where.status = q.status;

    if (q.q?.trim()) {
      const term = q.q.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }

    const rows = await this.prisma.activity.findMany({
      where,
      take: take + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        createdBy: {
          select: {
            id: true,
            email: true,
            profile: { select: { displayName: true } },
          },
        },
      },
    });

    const hasMore = rows.length > take;
    const page = rows.slice(0, take);
    const nextCursor = hasMore && page.length ? page[page.length - 1].id : null;

    const items = page.map((a) => ({
      id: a.id,
      title: a.title,
      category: a.category,
      status: a.status,
      plz: a.plz,
      startAt: a.scheduledAt ?? a.createdAt,
      createdBy: {
        id: a.createdBy.id,
        email: a.createdBy.email,
        displayName: a.createdBy.profile?.displayName ?? 'Neighbor',
      },
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      thumbnailUrl: a.images[0]?.url ?? null,
    }));

    return { items, nextCursor };
  }

  async getById(id: string) {
    const a = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        createdBy: {
          select: {
            id: true,
            email: true,
            profile: { select: { displayName: true, plz: true } },
          },
        },
      },
    });

    if (!a) throw new NotFoundException('Activity not found');

    return {
      id: a.id,
      title: a.title,
      description: a.description ?? undefined,
      category: a.category,
      status: a.status,
      startAt: a.scheduledAt ?? a.createdAt,
      plz: a.plz,
      createdBy: {
        id: a.createdBy.id,
        email: a.createdBy.email,
        displayName: a.createdBy.profile?.displayName ?? 'Neighbor',
      },
      images: a.images.map((img) => ({
        url: img.url,
        sortOrder: img.sortOrder,
        alt: img.alt ?? undefined,
      })),
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
  }

  async setStatus(actorId: string, id: string, dto: AdminSetActivityStatusDto) {
    const existing = await this.prisma.activity.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existing) throw new NotFoundException('Activity not found');

    const updated = await this.prisma.activity.update({
      where: { id },
      data: { status: dto.status },
      select: { id: true, status: true },
    });

    const action =
      dto.status === ActivityStatus.ARCHIVED
        ? AuditAction.ACTIVITY_ARCHIVED
        : AuditAction.ACTIVITY_RESTORED;

    await this.audit.log({
      actorUserId: actorId,
      action,
      entityType: AuditEntityType.ACTIVITY,
      entityId: id,
      metadata: { from: existing.status, to: updated.status },
    });

    return updated;
  }

  async bulkStatus(actorId: string, dto: AdminBulkActivityStatusDto) {
    const result = await this.prisma.activity.updateMany({
      where: { id: { in: dto.ids } },
      data: { status: dto.status },
    });

    await this.audit.log({
      actorUserId: actorId,
      action: AuditAction.ACTIVITIES_BULK_STATUS_CHANGED,
      entityType: AuditEntityType.ACTIVITY,
      entityId: 'BULK',
      metadata: {
        count: dto.ids.length,
        updatedCount: result.count,
        status: dto.status,
        ids: dto.ids,
      },
    });

    return { ok: true, updatedCount: result.count };
  }

  async update(actorId: string, id: string, dto: AdminUpdateActivityDto) {
    const existing = await this.prisma.activity.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        plz: true,
        scheduledAt: true,
      },
    });
    if (!existing) throw new NotFoundException('Activity not found');

    const data: Prisma.ActivityUpdateInput = {};
    if (dto.title !== undefined) {
      const title = dto.title.trim();
      if (!title) {
        throw new BadRequestException('Title cannot be empty');
      }
      data.title = title;
    }
    if (dto.description !== undefined)
      data.description = dto.description?.trim();
    if (dto.category !== undefined) data.category = dto.category as any;
    if (dto.plz !== undefined) data.plz = dto.plz;
    if (dto.scheduledAt !== undefined)
      data.scheduledAt = new Date(dto.scheduledAt);

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const updated = await this.prisma.activity.update({
      where: { id },
      data,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        plz: true,
        scheduledAt: true,
        updatedAt: true,
      },
    });

    await this.audit.log({
      actorUserId: actorId,
      action: AuditAction.ACTIVITY_EDITED,
      entityType: AuditEntityType.ACTIVITY,
      entityId: id,
      metadata: {
        from: {
          title: existing.title,
          description: existing.description,
          category: existing.category,
          plz: existing.plz,
          scheduledAt: existing.scheduledAt,
        },
        to: {
          title: updated.title,
          description: updated.description,
          category: updated.category,
          plz: updated.plz,
          scheduledAt: updated.scheduledAt,
        },
      },
    });

    return updated;
  }
}
