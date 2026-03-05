import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { AdminActivitiesService } from './admin-activities.service';
import {
  AdminBulkActivityStatusDto,
  AdminListActivitiesQueryDto,
  AdminSetActivityStatusDto,
  AdminUpdateActivityDto,
} from './dto/admin-activities.dto';

@ApiTags('admin')
@ApiBearerAuth('bearer')
@Controller('admin/activities')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminActivitiesController {
  constructor(private readonly adminActivities: AdminActivitiesService) {}

  @Get()
  list(@Query() q: AdminListActivitiesQueryDto) {
    return this.adminActivities.list(q);
  }

  @Patch('bulk/status')
  bulkStatus(
    @Req() req: Request & { user: { userId: string } },
    @Body() dto: AdminBulkActivityStatusDto,
  ) {
    return this.adminActivities.bulkStatus(req.user.userId, dto);
  }

  @Get(':id')
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.adminActivities.getById(id);
  }

  @Patch(':id')
  update(
    @Req() req: Request & { user: { userId: string } },
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AdminUpdateActivityDto,
  ) {
    return this.adminActivities.update(req.user.userId, id, dto);
  }

  @Patch(':id/status')
  setStatus(
    @Req() req: Request & { user: { userId: string } },
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AdminSetActivityStatusDto,
  ) {
    return this.adminActivities.setStatus(req.user.userId, id, dto);
  }
}
