import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { ModeratorController } from './moderator.controller';
import { RolesGuard } from 'src/auth/roles.guard';

@Module({
  controllers: [AdminController, ModeratorController],
  providers: [RolesGuard],
})
export class RbacModule {}
