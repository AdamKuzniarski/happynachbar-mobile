import { Injectable, Logger } from '@nestjs/common';
import { Prisma, AuditAction, AuditEntityType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private prisma: PrismaService) {}

  async log(input: {
    actorUserId?: string | null;
    action: AuditAction;
    entityType: AuditEntityType;
    entityId: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorUserId: input.actorUserId ?? null,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          metadata: input.metadata,
        },
      });
    } catch (e) {
      this.logger.warn(`Audit log failed: ${(e as Error).message}`);
    }
  }
}
