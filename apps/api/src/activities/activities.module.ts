import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { AuditModule } from 'src/audit/audit.module';
import { AdminActivitiesController } from './admin-activities.controller';
import { AdminActivitiesService } from './admin-activities.service';
import { RolesGuard } from 'src/auth/roles.guard';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ActivitiesController, AdminActivitiesController],
  providers: [ActivitiesService, AdminActivitiesService, RolesGuard],
})
export class ActivitiesModule {}
