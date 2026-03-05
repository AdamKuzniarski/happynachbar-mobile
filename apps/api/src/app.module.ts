import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { PublicNeighborsModule } from './public/public-neighbors.module';
import { NeighborsModule } from './neighbors/neighbors.module';
import { ActivitiesModule } from './activities/activities.module';
import { UploadsModule } from './uploads/uploads.module';
import { RbacModule } from './rbac/rbac.module';
import { ChatModule } from './chat/chat.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HealthModule,
    AuthModule,
    PrismaModule,
    UsersModule,
    PublicNeighborsModule,
    NeighborsModule,
    ActivitiesModule,
    UploadsModule,
    RbacModule,
    ChatModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
