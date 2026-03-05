import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiOkResponse({
    description: 'Simple health check',
    schema: {
      type: 'object',
      properties: { status: { type: 'string', example: 'ok' } },
    },
  })
  getHealth() {
    return { status: 'ok' };
  }

  @Get('db')
  @ApiOperation({ summary: 'Database health check' })
  @ApiOkResponse({
    description: 'Checks DB connectivity and basic table access',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'db ok' },
        usersCount: { type: 'number', example: 42 },
      },
    },
  })
  async getDbHealth() {
    //Connectivity check
    await this.prisma.$queryRaw`SELECT 1`;

    //Einfache Queries um sicherzustellen, dass die DB Tabellen erreichbar sind
    const usersCount = await this.prisma.user.count();

    return { status: 'db ok', usersCount };
  }
}
