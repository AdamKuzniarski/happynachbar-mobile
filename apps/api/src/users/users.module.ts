import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuditModule } from 'src/audit/audit.module';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { RolesGuard } from 'src/auth/roles.guard';

@Module({
  imports: [AuditModule],
  controllers: [UsersController, AdminUsersController],
  providers: [UsersService, AdminUsersService, RolesGuard],
})
export class UsersModule {}
