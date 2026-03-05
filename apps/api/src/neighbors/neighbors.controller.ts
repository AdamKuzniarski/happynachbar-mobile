import {
  ConflictException,
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { PrismaService } from 'src/prisma/prisma.service';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

class NeighborsMetricsQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number = 30;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  minCount?: number = 3;
}

@UseGuards(JwtAuthGuard)
@Controller('neighbors')
export class NeighborsController {
  constructor(private prisma: PrismaService) {}

  @Get('metrics')
  async metrics(@Req() req: any, @Query() q: NeighborsMetricsQuery) {
    const userId = req.user.userId;

    const windowDays = q.days ?? 30;
    const minCount = q.minCount ?? 3;

    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: { plz: true },
    });

    if (!profile?.plz) {
      throw new ConflictException('PLZ not set'); //response for 409/400
    }
    const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

    // alle außer DICH
    const count = await this.prisma.userProfile.count({
      where: {
        plz: profile.plz,
        userId: { not: userId }, //<--- hier not userId alle außer dich
        user: { lastActiveAt: { gte: cutoff } },
      },
    });
    const thresholdApplied = count < minCount;

    return {
      plz: profile.plz,
      windowDays,
      minCount,
      activeNeighbors: thresholdApplied ? 0 : count,
      thresholdApplied,
    };
  }
}
