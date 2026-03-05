import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

class NeighborsMetricsQuery {
  @Matches(/^\d{5}$/)
  plz: string;

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

@Controller('public/neighbors')
export class PublicNeighborsController {
  constructor(private prisma: PrismaService) {}

  @Get('metrics')
  async metrics(@Query() q: NeighborsMetricsQuery) {
    const windowDays = q.days ?? 30;
    const minCount = q.minCount ?? 3;

    const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

    const count = await this.prisma.userProfile.count({
      where: {
        plz: q.plz,
        user: { lastActiveAt: { gte: cutoff } },
      },
    });

    const thresholdApplied = count < minCount;

    return {
      plz: q.plz,
      windowDays,
      minCount,
      activeNeighbors: thresholdApplied ? 0 : count,
      thresholdApplied,
    };
  }
}
