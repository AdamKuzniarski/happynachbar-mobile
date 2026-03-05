import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { AdminUsersService } from './admin-users.service';
import {
  AdminListUsersQueryDto,
  AdminSetUserBanDto,
  AdminSetUserRoleDto,
} from './dto/admin-users.dto';
import {
  AdminCreateWarningDto,
  AdminListWarningsQueryDto,
} from './dto/admin-warnings.dto';

@ApiTags('admin')
@ApiBearerAuth('bearer')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUsersController {
  constructor(private readonly adminUsers: AdminUsersService) {}

  @Get()
  list(@Query() q: AdminListUsersQueryDto) {
    return this.adminUsers.listUsers(q);
  }

  @Patch(':id/role')
  setRole(
    @Req() req: Request & { user: { userId: string } },
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AdminSetUserRoleDto,
  ) {
    return this.adminUsers.setRole(req.user.userId, id, dto);
  }

  @Patch(':id/ban')
  setBan(
    @Req() req: Request & { user: { userId: string } },
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AdminSetUserBanDto,
  ) {
    return this.adminUsers.setBan(req.user.userId, id, dto);
  }

  @Get(':id/warnings')
  listWarnings(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() q: AdminListWarningsQueryDto,
  ) {
    return this.adminUsers.listWarnings(id, q);
  }

  @Post(':id/warnings')
  createWarning(
    @Req() req: Request & { user: { userId: string } },
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AdminCreateWarningDto,
  ) {
    return this.adminUsers.createWarning(req.user.userId, id, dto);
  }
}
