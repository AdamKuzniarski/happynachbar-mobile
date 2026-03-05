import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('public/users')
export class PublicUsersController {
  constructor(private prisma: PrismaService) {}

  @Get(':id')
  async getById(@Param('id', new ParseUUIDPipe()) id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        createdAt: true,
        profile: {
          select: {
            displayName: true,
            avatarUrl: true,
            bio: true,
            plz: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const profile = user.profile;

    return {
      displayName: profile?.displayName ?? 'Neighbor',
      avatarUrl: profile?.avatarUrl ?? null,
      bio: profile?.bio ?? null,
      plz: profile?.plz ?? null,
      createdAt: user.createdAt,
    };
  }
}
