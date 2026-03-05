import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, AuditEntityType, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditLogService } from 'src/audit/audit-log.service';
import {
  AdminListUsersQueryDto,
  AdminSetUserBanDto,
  AdminSetUserRoleDto,
} from './dto/admin-users.dto';
import {
  AdminCreateWarningDto,
  AdminListWarningsQueryDto,
} from './dto/admin-warnings.dto';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

@Injectable()
export class AdminUsersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditLogService,
  ) {}

  async listUsers(q: AdminListUsersQueryDto) {
    const take = clamp(q.take ?? 20, 1, 50);

    const where: Prisma.UserWhereInput = {};

    if (typeof q.isBanned === 'boolean') where.isBanned = q.isBanned;
    if (q.role) where.role = q.role;

    if (q.q?.trim()) {
      const term = q.q.trim();
      where.OR = [
        { email: { contains: term, mode: 'insensitive' } },
        {
          profile: {
            is: { displayName: { contains: term, mode: 'insensitive' } },
          },
        },
      ];
    }

    const rows = await this.prisma.user.findMany({
      where,
      take: take + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        email: true,
        role: true,
        isBanned: true,
        bannedAt: true,
        banReason: true,
        lastActiveAt: true,
        createdAt: true,
        profile: { select: { displayName: true, plz: true } },
      },
    });

    const hasMore = rows.length > take;
    const page = rows.slice(0, take);
    const nextCursor = hasMore && page.length ? page[page.length - 1].id : null;

    return { items: page, nextCursor };
  }

  async setRole(actorId: string, userId: string, dto: AdminSetUserRoleDto) {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!existing) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role: dto.role },
      select: { id: true, role: true },
    });

    await this.audit.log({
      actorUserId: actorId,
      action: AuditAction.USER_ROLE_CHANGED,
      entityType: AuditEntityType.USER,
      entityId: userId,
      metadata: { from: existing.role, to: updated.role },
    });

    return updated;
  }

  async setBan(actorId: string, userId: string, dto: AdminSetUserBanDto) {
    if (actorId === userId && dto.isBanned) {
      throw new BadRequestException('You cannot ban yourself');
    }

    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isBanned: true },
    });
    if (!existing) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: dto.isBanned,
        bannedAt: dto.isBanned ? new Date() : null,
        banReason: dto.isBanned ? (dto.reason ?? null) : null,
      },
      select: { id: true, isBanned: true, bannedAt: true, banReason: true },
    });

    await this.audit.log({
      actorUserId: actorId,
      action: dto.isBanned
        ? AuditAction.USER_BANNED
        : AuditAction.USER_UNBANNED,
      entityType: AuditEntityType.USER,
      entityId: userId,
      metadata: dto.isBanned ? { reason: dto.reason ?? null } : {},
    });

    return updated;
  }

  async listWarnings(userId: string, q: AdminListWarningsQueryDto) {
    const take = clamp(q.take ?? 20, 1, 50);

    const exists = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('User not found');

    const rows = await this.prisma.userWarning.findMany({
      where: { userId },
      take: take + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        createdByAdmin: {
          select: { id: true, profile: { select: { displayName: true } } },
        },
      },
    });

    const hasMore = rows.length > take;
    const page = rows.slice(0, take);
    const nextCursor = hasMore && page.length ? page[page.length - 1].id : null;

    const items = page.map((w) => ({
      id: w.id,
      userId: w.userId,
      message: w.message,
      severity: w.severity,
      expiresAt: w.expiresAt,
      createdAt: w.createdAt,
      createdByAdmin: {
        id: w.createdByAdmin.id,
        displayName: w.createdByAdmin.profile?.displayName ?? 'Neighbor',
      },
    }));

    return { items, nextCursor };
  }

  async createWarning(
    actorId: string,
    userId: string,
    dto: AdminCreateWarningDto,
  ) {
    const exists = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('User not found');

    const warning = await this.prisma.userWarning.create({
      data: {
        userId,
        message: dto.message,
        severity: dto.severity,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdByAdminId: actorId,
      },
      select: { id: true, userId: true, severity: true, createdAt: true },
    });

    await this.audit.log({
      actorUserId: actorId,
      action: AuditAction.USER_WARNING_CREATED,
      entityType: AuditEntityType.USER_WARNING,
      entityId: warning.id,
      metadata: { userId, severity: warning.severity },
    });

    return warning;
  }
}
